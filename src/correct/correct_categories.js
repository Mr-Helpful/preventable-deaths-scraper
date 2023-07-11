import { try_matching } from './helpers.js'
import { fetch_html } from '../fetch/helpers.js'
import { ElementError } from '../fetch/helpers.js'

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

let categories = {
  'Health Safety': 'Accident at Work and Health and Safety related deaths',
  'Alcohol Medication': 'Alcohol, drug and medication related deaths',
  'Care Home': 'Care Home Health related deaths',
  'Care home': 'Care Home Health related deaths',
  'Child Death': 'Child Death (from 2015)',
  'Community Health':
    'Community health care and emergency services related deaths',
  'Community Healthcare':
    'Community health care and emergency services related deaths',
  'Emergency Services': 'Emergency Services related deaths',
  'Emergency Services 2019': 'Emergency services related deaths (2019 onwards)',
  Hospital:
    'Hospital Death (Clinical Procedures and medical management) related deaths',
  'Mental Health': 'Mental Health related deaths',
  Other: 'Other related deaths',
  Police: 'Police related deaths',
  'Prevention Future': 'Prevention of Future Deaths',
  Product: 'Product related deaths',
  Railway: 'Railway related deaths',
  Road: 'Road (Highways Safety) related deaths',
  Highways: 'Road (Highways Safety) related deaths',
  'Service Personnel': 'Service Personnel related deaths',
  'State Custody': 'State Custody related deaths',
  Suicide: 'Suicide (from 2015)',
  Wales: 'Wales prevention of future deaths reports (2019 onwards)'
}

/** Corrects the category to the closest match in the preventable deaths list
 * @param {string} text the text to be corrected
 * @returns {string | undefined} the corrected category or undefined if no good match
 */
export function correct_category(text) {
  if (text === undefined) return undefined
  return text
    .split('|')
    .map(category => try_matching(category, categories))
    .filter(match => match !== undefined)
    .join(' | ')
}
