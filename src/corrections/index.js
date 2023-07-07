import { correct_date } from './correct_dates.js'
import { correct_area } from './correct_areas.js'

/** @typedef {import('../index.js').Full_Report} Full_Report */

/** Applies all corrections to a single report
 * @param {Full_Report} report the report to be corrected
 * @returns {Full_Report} the report with all corrections applied
 */
export function correct_report({ date_of_report, coroner_area, ...report }) {
  // console.log(coroner_area)
  const corrected = correct_area(coroner_area)
  return {
    ...report,
    date_of_report: correct_date(date_of_report),
    coroner_area: corrected
  }
}
