import fs from 'fs/promises'
import { PdfReader, TableParser, Rule } from 'pdfreader'

/* 
Plan of attack for parsing report pdfs:
1. Identify the first line of the first row of the table
  - this can probably be matched on "REGULATION 28 REPORT TO PREVENT" or similar
  - within the first row, the first column is always empty
2. Identify all text in the first column of the table
  - this can be done as all the text in the first column is:
  1. to the left of the second column
  2. a number (this is mostly needed so we can detect a failed parse)
3. Identify the start an ends for each row of the table
  - this is possible by splitting on the y positions of the first column
  - as the first column is only numbers it, it'll only take up one text entry
4. Merge the text in the second column of the table
  - once bounding boxes (previous step) are found merging can be done by
  1. assuming that all text entries on the same line are separated by spaces
  2. setting distance between lines that counts for 1 new line
5. Identify headers within each merged row
  - this can be done via a regex on the first line of each row
  - this will (hopefully) give a object from header to text value


Assumptions made by this method:
- first line of the table is unique within the pdf
- column positions don't change between pages
- only spaces are used within lines of text
- line spacing is consistent within the pdf and between pdfs


Design considerations:
- we're going to be using a functional style for this, as it's what I'm used to 
  and allows us to easily keep track of the current state built up
- all our functions will be of the form (state, item) => state
  - our items should give their y coordinate in terms of a continuous scroll
  - this can be implemented by a wrapper around the pdf reader
*/

const pdf_examples = await Promise.all(
  [
    'examples/Amy_Henderson.pdf',
    'examples/Chris_Evans.pdf',
    'examples/Jodie_McCann.pdf',
    'examples/Joseph_Maunick.pdf',
    'examples/Peter_Lawrence.pdf'
  ].map(example => fs.realpath(example))
)

/** Folds a parser over each item in a pdf ascynronously
 *
 * @template S
 * @param {string} path the file path to the pdf
 * @param {(item: PDFItem, state: S) => S} parser the parser to run on the pdf
 * @returns {Promise<S>} the state after parsing the pdf
 */
function parse_pdf(path, parser) {
  const reader = new PdfReader()
  let state = {} // our parser should handle filling in state

  return new Promise((resolve, reject) => {
    reader.parseFileItems(path, (err, item) => {
      if (err) return reject(err)

      try {
        state = parser(item, state)
        if (!item) resolve(state)
      } catch (err) {
        reject(err)
      }
    })
  })
}

// reader.parseFileItems(pdf_examples[0], (err, item) => {
//   if (err) console.error(err)
//   else if (!item) console.log('done')
//   else if (item.text) console.log(item)
// })

/** @typedef {{x: number, y: number, w: number, sw: number, A: string, R: {T: string, S: number, TS: number[]}, oc: string, text: string}} TextItem */

/** @typedef {null | {file:{path:string}} | {page: number, width: number, height: number} | TextItem} PDFItem */

/** Merges any items that are not separated by a space
 *
 * @param {TextItem[]} line the line to merge close items in
 */
function merge_items(line) {
  line.sort((a, b) => a.x - b.x)
  let merged = []
  let curr = { ...line[0], w: 0, text: '' }

  for (const item of line) {
    if (curr.x + curr.sw * curr.text.length > item.x) {
      curr.text += item.text
    } else {
      merged.push(curr)
      curr = item
    }
  }

  merged.push(curr)
  return merged
}

/** A semi-pure function that converts a parser for each line of the pdf
 * into a parser for items within the pdf
 * lines will be parsed in order of y coordinate
 *
 * @template S
 * @param {(line: TextItem[], state: S) => S} line_parser
 * @returns {(item: PDFItem, state: S) => S}
 */
function item_parser_from_lines(line_parser) {
  let offset = 0
  let lines = {}

  return function (item, state) {
    if (item?.file) return state
    if (item?.text) {
      item.y += offset
      lines[item.y] ??= []
      lines[item.y].push(item)
      return state
    }

    const entries = Object.entries(lines)
    entries.sort((a, b) => a[0] - b[0])
    // console.log(entries)
    for (let [_, line] of entries) {
      line = merge_items(line)
      // console.log(line)
      // process.exit()
      state = line_parser(line, state)
    }

    if (!item) state = line_parser(null, state)
    else {
      offset += item.height
      lines = {}
    }

    return state
  }
}

/** A function that searches for a regex within a line
 *
 * @param {TextItem[]} line the line to test
 * @param {RegExp} regex the regex to test against
 * @returns whether the line matches the regex
 */
function line_matches(line, regex) {
  return regex.test(line.map(item => item.text).join(' '))
}

/**
 * @typedef {Object} TableState
 * @property {number} x_end1 The x coordinate of the end of the first column
 * @property {TextItem[][]} row The current row being parsed
 * @property {TextItem[][][]} table The table that has been parsed so far
 */

/** Parses a report table from a pdf, line by line
 *
 * @param {TextItem[]} line The line to add to the table parse
 * @param {TableState} state The state of the table
 * @returns {TableState}
 */
function report_table_parser(line, { x_end1, row = [], table = [] }) {
  // end of the table
  if (!line) return { x_end1, row: [], table: [...table, row] }

  // first line of the table
  if (line_matches(line, /REGULATION 28 REPORT TO PREVENT/)) {
    x_end1 = line[0].x
    row.push(line)
  }

  // if we're before the table, return early
  if (!x_end1) return { x_end1, row, table }

  if (line[0].x < x_end1) {
    // a new row within the table
    table.push(row)
    row = [line.slice(1)]
  } else {
    // a new line within the current row
    row.push(line)
  }

  return { x_end1, row, table }
}

async function parse_pdf_report(path) {
  const parser = item_parser_from_lines(report_table_parser)
  const { table } = await parse_pdf(path, parser)
  return table.map(row => {
    let contents = ''

    for (const [i, line] of row.entries()) {
      contents += line.map(item => item.text).join(' ')

      let next = row[i + 1]
      if (next?.[0]?.R?.[0]?.TS && line[0]) {
        let line_height = next[0].R[0].TS[1] // font height in px (I think???)
        const diff = next[0].y - line[0].y
        contents += '\n'.repeat(Math.ceil(diff / line_height))
      }
    }

    return contents
  })
}

console.log(await parse_pdf_report(pdf_examples[0]))
