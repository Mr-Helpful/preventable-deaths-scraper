import { correct_date } from './correct_dates.js'
import { correct_area } from './correct_areas.js'
import { correct_category } from './correct_categories.js'

/** @typedef {import('../index.js').Full_Report} Full_Report */

/** Applies all corrections to a single report
 * @param {Full_Report} report the report to be corrected
 * @returns {Full_Report} the report with all corrections applied
 */
export function correct_report({
  date_of_report,
  coroner_area,
  category,
  ...report
}) {
  return {
    ...report,
    date_of_report: correct_date(date_of_report),
    coroner_area: correct_area(coroner_area),
    category: correct_category(category)
  }
}
