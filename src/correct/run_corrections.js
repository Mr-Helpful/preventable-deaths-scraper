import Papa from 'papaparse'
import fs from 'fs/promises'
import { correct_report } from './index.js'

async function correct_current_reports(csv_path, out_path) {
  const file = await fs.readFile(csv_path, 'utf8')
  const reports = Papa.parse(file, { header: true }).data
  const headers = Object.keys(reports[0] ?? {})
  await fs.rm(out_path, { force: true })

  const corrected = reports.map(report => {
    const correct = correct_report(report)
    return Object.fromEntries(headers.map(header => [header, correct[header]]))
  })
  console.log('corrections applied')
  await fs.writeFile(out_path, Papa.unparse(corrected))
}

correct_current_reports('./src/data/reports.csv', './src/data/corrected.csv')
