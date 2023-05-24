import { table_parser } from './helpers.js'
/** @typedef {import('./helpers.js').Parser} Parser */
/** @typedef {import('./helpers.js').HeadersFor} HeadersFor */

/** Data generated from just the overview on the report page.
 * Less detailed but easier to parse and therefore more reliable.
 * @typedef {object} Basic_Summary
 * @prop {string} date
 * @prop {string} ref
 * @prop {string} deceased
 * @prop {string} name
 * @prop {string} area
 * @prop {string} category
 * @prop {string} to
 */

/** @type {Basic_Summary} */
export const default_summary = {
  date: '',
  ref: '',
  deceased: '',
  name: '',
  area: '',
  category: '',
  to: ''
}

/** @type {HeadersFor<Basic_Summary>} */
const summary_headers = {
  'Date of report:?': 'date',
  'Ref:?': 'ref',
  'Deceased name:?': 'deceased',
  'Coroner name:?': 'coroner',
  'Coroner Area:?': 'area',
  'Category:?': 'category',
  'This report is being sent to:?': 'to'
}

/** Parses a summary from a list of html rows
 * @type {Parser<Basic_Summary>}
 */
export const parse_summary_basic = table_parser(summary_headers)
