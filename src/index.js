import { correct_report } from './correct/index.js'
import {
  fetch_page_urls,
  fetch_unseen_urls,
  fetch_report,
  map_async
} from './fetch/index.js'
import { parse_report_basic, parse_summary_basic } from './parse/index.js'
import { try_create_csv, append_csv_row, write_log } from './write/index.js'

/** Type imports
 * @typedef {import('cheerio').CheerioAPI} CheerioAPI
 * @typedef {import('./fetch/helpers.js').NetworkError} NetworkError
 * @typedef {import('./fetch/helpers.js').ElementError} ElementError
 * @typedef {import('./parse/helpers.js').Parser} Parser
 * @typedef {import('./parse/parse_report.js').Basic_Report} Report
 * @typedef {import('./parse/parse_summary.js').Basic_Summary} Summary
 */

/** @typedef {{report_url: string, pdf_url: string}} URLs */

/** Fetches and writes reports to the given `.csv` file
 * @template R, S
 * @param {string} reports_url the url to fetch from
 * @param {string} csv_path the `.csv` file to write reports to
 * @param {string} log_path where to write a log of the latest fetch
 * @param {string[]} headers the headers we're using for the `.csv` file
 * @param {Parser<R>} parse_report
 * @param {Parser<S>} parse_summary
 */
export async function write_reports(
  reports_url,
  csv_path,
  log_path,
  headers,
  parse_report,
  parse_summary
) {
  await try_create_csv(csv_path, headers)
  const page_urls = await fetch_page_urls(reports_url)
  const urls = await fetch_unseen_urls(page_urls, csv_path)
  await write_log(log_path, page_urls.length, urls.length)

  if (urls.length === 0) return console.log('Reports up to date!')
  await map_async(
    urls,
    url =>
      fetch_report(url, parse_report, parse_summary)
        // .then(report => correct_report(report))
        .then(report => append_csv_row(report, csv_path, headers))
        .catch(_ => {
          // ignore any errors from this, we'll either get it next time
          // or this report can't be effectively read at all
        }),
    'Reading reports |:bar| :current/:total urls'
  )
}

/** @typedef {Summary & Report & URLs} Full_Report */
/** @type {(keyof Full_Report)[]} */
const headers = [
  'date_of_report',
  'ref',
  'deceased_name',
  'coroner_name',
  'coroner_area',
  'category',
  'this_report_is_being_sent_to',
  'report_url',
  'pdf_url',
  'circumstances',
  'concerns',
  'inquest',
  'action',
  'response',
  'legal'
]

write_reports(
  'https://www.judiciary.uk/prevention-of-future-death-reports/',
  'src/data/reports.csv',
  'src/data/latest.log',
  headers,
  parse_report_basic,
  parse_summary_basic
)
