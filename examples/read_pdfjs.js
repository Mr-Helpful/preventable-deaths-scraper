import fs from 'fs/promises'
import pdfjs from 'pdfjs-dist/legacy/build/pdf.js'

/*
Assumptions:
- all text is left-to-right
- all text on a line is the same size
*/

const example = await fs.realpath('examples/Amy_Henderson.pdf')
const doc = await pdfjs.getDocument(example).promise

const pages = await Promise.all(
  new Array({ length: doc.numPages }).map((_, i) => doc.getPage(i + 1))
)
const page0 = pages[0]

const content = await page0.getTextContent()

function item_bbox({ width, height, transform }, view_transform) {
  transform = pdfjs.Util.transform(view_transform, transform)
  return {
    tl: [transform[4], transform[5]],
    br: pdfjs.Util.applyTransform([width, height], transform)
  }
}

function item_font_width({ transform }, view_transform) {
  transform = pdfjs.Util.transform(view_transform, transform)
  return Math.sqrt(transform[0] ** 2 + transform[1] ** 2)
}

function merge_line(line, view_transform) {
  let text = ''
  let x

  for (const { str, ...item } of line) {
    const { tl, br } = item_bbox(item, view_transform)
    x ??= tl[0]

    const dx = Math.max(tl[0] - x, 0)
    const width = item_font_width(item, view_transform)

    // spaces are typically 0.25em wide
    // hence they are 0.25 * font width
    const space_width = width * 0.25
    const nspaces = Math.floor(dx / space_width)

    text += '§'.repeat(nspaces) + str
    x = br[0]
  }

  return text
}

/**
 * @param {import('pdfjs-dist').PDFPageProxy} page
 */
async function page_to_lines(page) {
  let lines = {}

  const { items } = await page.getTextContent()
}
