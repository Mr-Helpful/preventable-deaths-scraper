import { table_parser } from './helpers.js'
/** @typedef {import('./helpers.js').Parser} Parser */
/** @typedef {import('./helpers.js').HeadersFor} HeadersFor */

/** Data generated from just the overview on the report page.
 * Less detailed but easier to parse and therefore more reliable.
 * @typedef {object} Basic_Summary
 * @prop {string} date_of_report
 * @prop {string} ref
 * @prop {string} deceased_name
 * @prop {string} coroner_name
 * @prop {string} coroner_area
 * @prop {string} category
 * @prop {string} this_report_is_being_sent_to
 */

/** @type {Basic_Summary} */
export const default_summary = {
  date_of_report: '',
  ref: '',
  deceased_name: '',
  coroner_name: '',
  coroner_area: '',
  category: '',
  this_report_is_being_sent_to: ''
}

/** @type {HeadersFor<Basic_Summary>} */
const summary_headers = {
  'Date of report:?': 'date_of_report',
  'Ref:?': 'ref',
  'Deceased name:?': 'deceased_name',
  'Coroner name:?': 'coroner_name',
  'Coroner Area:?': 'coroner_area',
  'Category:?': 'category',
  'This report is being sent to:?': 'this_report_is_being_sent_to'
}

/** Parses a summary from a list of html rows
 * @type {Parser<Basic_Summary>}
 */
export const parse_summary_basic = table_parser(summary_headers)
