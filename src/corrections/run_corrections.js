import { map_async } from '../fetch/helpers.js'
import { append_csv_row, try_create_csv } from '../write/csv.js'
import Papa from 'papaparse'
import fs from 'fs/promises'
import { correct_report } from './index.js'

export async function correct_current_reports(csv_path, out_path) {
  const file = await fs.readFile(csv_path, 'utf8')
  const reports = Papa.parse(file, { header: true }).data
  const headers = Object.keys(reports[0] ?? {})
  await fs.rm(out_path, { force: true })
  await try_create_csv(out_path, headers)

  await map_async(
    reports,
    report => append_csv_row(correct_report(report), out_path, headers),
    'Correcting reports |:bar| :current/:total reports'
  )
}

correct_current_reports('./src/data/reports.csv', './src/data/reports.csv')
