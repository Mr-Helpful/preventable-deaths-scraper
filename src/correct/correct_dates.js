import fs from 'fs/promises'
import parse from 'date-fns/parse/index.js'
import { min_edit_slices_match } from './approx_match.js'
import { load_correction_data } from './helpers.js'

const FULL_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
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
function parse_d_MMMM_Y_date(text) {
  const { slice, match } = min_edit_slices_match(FULL_MONTHS, text, false, true)
  text = text.replace(slice, ` ${match} `).replace(/\s+/g, ' ')
  return (
    parse_or_none(text, 'do MMMM yyyy') ?? parse_or_none(text, 'd MMMM yyyy')
  )
}

/** Parses a date in `do MMM Y` format, i.e. 4th Jan 2015
 * @param {string} text the text to be parsed
 */
function parse_d_MMM_Y_date(text) {
  const { slice, match } = min_edit_slices_match(
    SHORT_MONTHS,
    text,
    false,
    true
  )
  text = text.replace(slice, ` ${match} `).replace(/\s+/g, ' ')
  return parse_or_none(text, 'do MMM yyyy') ?? parse_or_none(text, 'd MMM yyyy')
}

/**
 * Creates a function that corrects the date to the nearest plausible
 * representation in en-GB format
 * @param {boolean} keep_failed whether to keep existing failed parses
 * @returns {Promise<import('.').CorrectFn<string>>}
 */
export default async function Corrector(keep_failed = true) {
  let { failed, incorrect, corrections } = await load_correction_data('dates')
  if (!keep_failed) failed = []

  function correct_date(text) {
    if (text === undefined || text.length === 0) return undefined
    if (incorrect.has(text)) return undefined

    const manual = corrections.find(replace => replace[text])
    if (manual) return manual[text]

    const date =
      parse_dd_MM_y_date(text) ??
      parse_d_MMM_Y_date(text) ??
      parse_d_MMMM_Y_date(text)

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
      JSON.stringify(failed, null, 2)
    )
  return correct_date
}
