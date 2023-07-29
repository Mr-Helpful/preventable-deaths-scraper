import fs from 'fs/promises'
import parse from 'date-fns/parse/index.js'
import { min_edit_slices_match } from './approx_match.js'

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

function parse_or_none(text, pat) {
  const date = parse(text, pat, new Date())
  return isNaN(date) ? undefined : date
}

/** Parses a date in `dd/MM/y` format, i.e. 04/01/2015
 * @param {string} text the text to be parsed
 */
function parse_dd_MM_y_date(text) {
  text = text.replace(/[^\/0-9]/g, '')
  return parse_or_none(text, 'dd/MM/y')
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

/**
 * Creates a function that corrects the date to the nearest plausible
 * representation in en-GB format
 * @param {boolean} keep_failed whether to keep existing failed parses
 * @returns {Promise<import('.').CorrectFn<string>>}
 */
export default async function Corrector(keep_failed = true) {
  let { default: failed } = keep_failed
    ? await import('./failed_parses/dates.json', {
        assert: { type: 'json' }
      })
    : { default: [] }

  function correct_date(text) {
    if (text === undefined || text.length === 0) return text

    const date =
      parse_dd_MM_y_date(text) ??
      parse_do_MMMM_Y_date(text) ??
      parse_do_MMM_Y_date(text)

    if (date === undefined) {
      failed.push(text)
      return text
    }
    // special case: someone doesn't include the leading 20 in the year
    if (date.getFullYear() < 2000) {
      date.setFullYear(date.getFullYear() + 2000)
    }
    return date.toLocaleDateString('en-GB')
  }

  correct_date.close = () =>
    fs.writeFile(
      './src/correct/failed_parses/dates.json',
      JSON.stringify(failed)
    )
  return correct_date
}
