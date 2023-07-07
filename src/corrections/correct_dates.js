import parse from 'date-fns/parse/index.js'
import { min_edit_slices_match } from './helpers.js'

// we put spaces around the months to attempt to avoid weird characters being
// placed around them
const FULL_MONTHS = [
  ' January ',
  ' February ',
  ' March ',
  ' April ',
  ' May ',
  ' June ',
  ' July ',
  ' August ',
  ' September ',
  ' October ',
  ' November ',
  ' December '
]

const SHORT_MONTHS = [
  ' Jan ',
  ' Feb ',
  ' Mar ',
  ' Apr ',
  ' May ',
  ' Jun ',
  ' Jul ',
  ' Aug ',
  ' Sep ',
  ' Oct ',
  ' Nov ',
  ' Dec '
]

/** Converts all dates passed in into dd/mm/yyyy format
 * @param {string} text the text to be corrected
 * @returns {string} the corrected date formatted as dd/mm/yyyy
 */
export function correct_date(text) {
  text = text.replace('&#xa0;', '').trim()
  const date =
    parse_dd_MM_yyyy_date(text) ??
    parse_do_MMMM_Y_date(text) ??
    parse_do_MMM_Y_date(text)

  if (date === undefined) return text
  return date.toLocaleDateString('en-GB')
}

function parse_or_none(text, pat) {
  const date = parse(text, pat, new Date())
  return isNaN(date) ? undefined : date
}

/** Parses a date in `dd/MM/yyyy` format, i.e. 04/01/2015
 * @param {string} text the text to be parsed
 */
function parse_dd_MM_yyyy_date(text) {
  text = text.replace(/[^\/0-9]/g, '')
  return parse_or_none(text, 'dd/MM/yyyy')
}

/** Parses a date in `do MMMM Y` format, i.e. 4th January 2015
 * @param {string} text the text to be parsed
 */
function parse_do_MMMM_Y_date(text) {
  const { slice, match } = min_edit_slices_match(FULL_MONTHS, text)
  text = text.replace(slice, match)
  return parse_or_none(text, 'do MMMM yyyy')
}

/** Parses a date in `do MMM Y` format, i.e. 4th Jan 2015
 * @param {string} text the text to be parsed
 */
function parse_do_MMM_Y_date(text) {
  const { slice, match } = min_edit_slices_match(SHORT_MONTHS, text)
  text = text.replace(slice, match)
  return parse_or_none(text, 'do MMM yyyy')
}
