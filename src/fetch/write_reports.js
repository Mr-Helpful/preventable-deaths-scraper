import { fetch_page_urls, fetch_remaining_urls } from './fetch_urls.js'
import { fetch_report } from './fetch_report.js'
import { try_create_csv, append_csv_row, write_log } from '../write/index.js'

/** Type imports
 * @typedef {import('cheerio').CheerioAPI} CheerioAPI
 * @typedef {import('./helpers.js').NetworkError} NetworkError
 * @typedef {import('./helpers.js').ElementError} ElementError
 * @typedef {import('../parse/helpers.js').Parser} Parser
 * @typedef {import('../parse/parse_report.js').Basic_Report} Report
 * @typedef {import('../parse/parse_summary.js').Basic_Summary} Summary
 */

/** Fetches and writes report to the given `.json` file
 * @template R, S
 * @param {string} reports_url the url to fetch from
 * @param {string} csv_path the .csv file to write reports to
 * @param {string} log_path where to write a log of the latest fetch
 * @param {string[]} headers the headers we're using for the .csv file
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
  const urls = await fetch_remaining_urls(page_urls, csv_path)
  await write_log(log_path, page_urls.length, urls.length)

  if (urls.length === 0) return console.log('Reports up to date!')
  await urls.map_async(async url => {
    const report = await fetch_report(url, parse_report, parse_summary)
    await append_csv_row(report, csv_path, headers)
  }, 'Reading reports |:bar| :current/:total urls')
}
