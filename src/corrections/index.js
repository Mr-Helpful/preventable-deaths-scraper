import { correct_date } from './correct_dates.js'
import { correct_area } from './correct_areas.js'
import { map_async } from '../fetch/helpers.js'
import { append_csv_row, try_create_csv } from '../write/csv.js'
import Papa from 'papaparse'
import fs from 'fs/promises'

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

export async function correct_current_reports(csv_path, out_path) {
  const file = await fs.readFile(csv_path, 'utf8')
  const reports = Papa.parse(file, { header: true }).data
  const headers = Object.keys(reports[0] ?? {})
  await try_create_csv(out_path, headers)

  await map_async(
    reports,
    report => append_csv_row(correct_report(report), out_path, headers),
    'Correcting reports |:bar| :current/:total reports'
  )
}

correct_current_reports(
  './src/data/reports.csv',
  './src/corrections/reports_corrected.csv'
)
