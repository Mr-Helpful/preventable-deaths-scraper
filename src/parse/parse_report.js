import { parse_list, table_parser } from './helpers.js'
/** @typedef {import('./helpers.js').Parser} Parser */
/** @typedef {import('./helpers.js').HeadersFor} HeadersFor */

/** A very basic format for the reports, each field is just a string
 *
 * Fields marked with a `*` are probably going to be refactored into a more
 * accurate form, i.e. dates into 3-tuples, `to` field into a list of names,
 * etc...
 *
 * @typedef Basic_Report
 * @type {object}
 * @prop {string} to *
 * @prop {string} name *
 * @prop {string} legal *
 * @prop {string} inquest
 * @prop {string} circumstances
 * @prop {string} concerns
 * @prop {string} action *
 * @prop {string} response *
 * @prop {string} date *
 */

/** @type {Basic_Report} */
export const default_report = {
  this_report_is_being_sent_to: '',
  coroner_name: '',
  legal: '',
  inquest: '',
  circumstances: '',
  concerns: '',
  action: '',
  response: '',
  date_of_report: ''
}

/** @type {HeadersFor<Basic_Report>} */
export const report_headings = {
  'THIS REPORT IS BEING SENT TO:?': 'this_report_is_being_sent_to',
  '1\\s*CORONER': 'coroner_name',
  "2\\s*CORONER[’']S LEGAL POWERS": 'legal',
  '3\\s*INVESTIGATION and INQUEST': 'inquest',
  '4\\s*CIRCUMSTANCES OF THE DEATH': 'circumstances',
  "5\\s*CORONER[’']S CONCERNS": 'concerns',
  '6\\s*ACTION SHOULD BE TAKEN': 'action',
  '7\\s*YOUR RESPONSE': 'response',
  '8\\s*COPIES and PUBLICATION': 'copies',
  9: 'date_of_report' // TODO: find out a good way to match this heading
}

/** Parses the rows of a table, using the headers
 * @template R
 * @param {string} text the text to parse
 * @param {Parser<R>} parse_report the custom report parser to use
 * @return {string[] | undefined} the table rows resulting
 */
export function parse_rows(text, parse_report) {
  let table = []
  for (const heading in report_headings) {
    let match = text.match(RegExp(`(.*)\\s+(${heading}\\s+.*)`))
    if (match) {
      table.push(match[1])
      text = match[2]
    }
  }

  table = table.slice(1)
  return parse_report(table)
}

/** Parses field into the basic format for a report
 * @type {Parser<Basic_Report>}
 */
export const parse_report_basic = table_parser(report_headings)

// export function parse_report(string) {
//   const template = { to: parse_to_field, name: parse_name_field }
// }

// /** Attempts to parse the `to` field of a report
//  * @param {string} field the string representation to parse
//  * @return {string[]} names contained within the field
//  */
// function parse_to_field(field) {
//   const field_template = /(?:THIS REPORT IS BEING SENT TO:)?\s*(?<names>.*)/i
//   return parse_list(field.match(field_template).groups.names)
// }

// /** Attempts to parse the `name` field of a report
//  * @param {string} field the string representation to parse
//  * @return {{name: string, area: string}} name contained within the field
//  */
// function parse_name_field(field) {
//   const common_prefix = /CORONER\s*(?:I am)\s*?/
//   return field.replace(common_prefix, '')
// }

// function parse_legal_field(field) {}
