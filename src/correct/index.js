import AreaCorrector from './correct_areas.js'
import CategoryCorrector from './correct_categories.js'
import DateCorrector from './correct_dates.js'
import NameCorrector from './correct_names.js'

/** @typedef {import('../index.js').Full_Report} Full_Report */
/**
 * @template T
 * @typedef {{(data: T) => T, close: () => Promise<void>}} CorrectFn
 */

/**
 * Corrects fields in a report to the closest reasonable value
 * @param {boolean} keep_failed whether to keep existing failed parses
 * @returns {Promise<CorrectFn<Full_Report>>}
 */
export default async function Corrector() {
  const correct_date = await DateCorrector()
  const correct_area = await AreaCorrector()
  const correct_name = await NameCorrector()
  const correct_category = await CategoryCorrector()

  function correct_report(report) {
    return {
      ...report,
      date_of_report: correct_date(report.date_of_report),
      coroner_area: correct_area(report.coroner_area),
      coroner_name: correct_name(report.coroner_name),
      category: correct_category(report.category)
    }
  }

  correct_report.close = () =>
    Promise.all([
      correct_date.close(),
      correct_area.close(),
      correct_name.close(),
      correct_category.close()
    ])
  return correct_report
}
