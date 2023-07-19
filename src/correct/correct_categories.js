import { priority_match } from './helpers.js'
import { fetch_html } from '../fetch/helpers.js'
import { ElementError } from '../fetch/helpers.js'
import categories from './category_corrections.json' assert { type: 'json' }

/** Fetches the list of report categories from the preventable deaths website
 * @param {string} url the coroner society url
 * @returns {Promise<string[]>} the list of coroner areas
 */
async function fetch_category_list(url) {
  const $ = await fetch_html(url)
  const list_path = '#filter-pfd_report_type > option'
  const list_rows = $(list_path)
  if (list_rows.length === 0) throw new ElementError('category list not found')

  return list_rows
    .get()
    .map(row => $(row).text())
    .filter(x => x !== 'Select element')
}

/** Corrects the category to the closest match in the preventable deaths list
 * @param {string} text the text to be corrected
 * @returns {string | undefined} the corrected category or undefined if no good match
 */
export function correct_category(text) {
  if (text === undefined) return undefined
  return text
    .split('|')
    .map(category => priority_match(category, categories))
    .filter(match => match !== undefined)
    .join(' | ')
}
