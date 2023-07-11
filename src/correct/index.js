import { correct_area } from './correct_areas.js'
import { correct_category } from './correct_categories.js'
import { correct_date } from './correct_dates.js'
import { correct_name } from './correct_names.js'

/** @typedef {import('../index.js').Full_Report} Full_Report */

/** Applies all corrections to a single report
 * @param {Full_Report} report the report to be corrected
 * @returns {Full_Report} the report with all corrections applied
 */
export function correct_report({
  date_of_report,
  coroner_area,
  coroner_name,
  category,
  ...report
}) {
  return {
    ...report,
    date_of_report: correct_date(date_of_report),
    coroner_area: correct_area(coroner_area),
    coroner_name: correct_name(coroner_name),
    category: correct_category(category)
  }
}
