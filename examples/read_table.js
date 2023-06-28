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

const reader = new PdfReader()
function parse_lines(path) {
  let pages = []
  let rows = {}

  return new Promise((resolve, reject) =>
    reader.parseFileItems(path, function (err, item) {
      if (err) reject(err)
      else if (!item) {
        let result = []
        for (const { page, rows } of pages) {
          let entries = Object.entries(rows)
          entries.sort((a, b) => a[0] - b[0])
          result.push({ page, rows: entries.map(([_, items]) => items) })
        }
        resolve(result)
      } else if (item.page) {
        pages.push({ page: item.page, rows })
        rows = {}
      } else if (item.text) {
        rows[item.y] ??= []
        rows[item.y].push(item)
      }
    })
  )
}

const lines0 = await parse_lines(pdf_examples[0])
await fs.writeFile('examples/Amy_Henderson.json', JSON.stringify(lines0))
