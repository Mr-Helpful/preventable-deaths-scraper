import { parse_rows } from '../parse/parse_report.js'
import { fetch_html, fetch_pdf, ElementError } from './helpers.js'

/** Type imports
 * @typedef {import('cheerio').CheerioAPI} CheerioAPI
 * @typedef {import('../parse/helpers.js').Parser} Parser
 */

/** Attempts to fetch a table from the report's overview.
 * All of the reports have a pdf overview attached, but its data is much more
 * limited than either the html table or the pdf table
 * @template S
 * @throws {ElementError}
 * @param {CheerioAPI} $ JQuery in the page given
 * @param {Parser<S>} parse_summary the custom summary parser to use
 * @return {Promise<S>} the formatted summary
 */
async function try_fetch_summary($, parse_summary) {
  const data_path = 'div.flow > p'
  const data_rows = $(data_path)
  if (data_rows.length === 0) throw new ElementError('summary rows not found')

  // we need to clean up the html a bit
  data_rows.before('\n')
  data_rows.find(`br`).replaceWith('\n')
  return parse_summary(data_rows.get().map(row => $(row).text()))
}

/** Attempts to fetch the category of death from the report's tags.
 *
 * @template S
 * @throws {ElementError}
 * @param {CheerioAPI} $ JQuery in the page given
 * @param {Parser<S>} parse_summary the custom summary parser to use
 * @return {Promise<S>} the formatted summary
 */
async function try_fetch_tags($) {
  const tag_path = '.single__title + p.pill--single > a'
  const tags = $(tag_path)
  if (tags.length === 0) throw new ElementError('tags not found')

  return {
    category: tags
      .get()
      .map(tag => $(tag).text())
      .join(' | ')
  }
}

/** Attempts to fetch a table from the report webpage.
 * Some of the report webpages have a nice table on them, which is honestly
 * just easier to scrape than trying to work out what's in the pdf download.
 * @template R
 * @param {CheerioAPI} $ JQuery in the page given
 * @param {Parser<R>} parse_report the custom report parser to use
 * @return {Promise<R>} the formatted report, or undefined for no table
 */
async function try_fetch_table($, parse_report) {
  const row_path = 'tbody.govuk-table__body > tr.govuk-table__row'
  const table_rows = $(row_path)
  if (table_rows.length === 0) throw new ElementError('table rows not found')

  // we need to clean up the html a bit
  table_rows.before('\n')
  table_rows.find(`br`).replaceWith('\n')
  return parse_report(table_rows.get().map(row => $(row).text()))
}

/** Attempts to fetch a table from the report's pdf.
 * All of the reports have a pdf attached, which we can attempt to parse.
 * Unfortunately the method we use to parse uses OCR and hence isn't perfect.
 *
 * There's like 4 reports (among the earliest) that don't fit the table format
 * and several seemingly photoscanned pdfs (scattered everywhere), so those'll
 * also fail to parse from this test.
 *
 * @throws {ElementError | NetworkError}
 * @param {CheerioAPI} $ JQuery in the page given
 * @param {Parser<R>} parse_report the custom report parser to use
 * @return {Promise<R>} the formatted report
 */
async function try_fetch_pdf($, parse_report) {
  const pdf_path = 'a.related-content__link'
  const url = $(pdf_path).attr('href')
  if (url === undefined) throw new ElementError('pdf link not found')
  if (url.length === 0) throw new ElementError('empty pdf link found')

  return parse_rows(await fetch_pdf(url), parse_report)
}

/** Fetches a single report from a url and parses it
 * @template R, S
 * @param {string} report_url the url for the report
 * @param {Parser<R>} parse_report the custom report parser to use
 * @param {Parser<S>} parse_summary the custom summary parser to use
 * @return {Promise<R & S & {pdf_url: string}>} the formatted report
 */
export async function fetch_report(report_url, parse_report, parse_summary) {
  let $ = await fetch_html(report_url)

  const pdf_path = 'a.related-content__link'
  const pdf_url = $(pdf_path).attr('href')

  const throw_network = err => {
    if (err?.name === 'NetworkError') throw err
  }
  let summary = await try_fetch_summary($, parse_summary).catch(throw_network)
  summary ??= await try_fetch_tags($).catch(throw_network)
  let report = await try_fetch_table($, parse_report).catch(throw_network)
  report ??= await try_fetch_pdf($, parse_report).catch(throw_network)

  // the most reliable parses are from
  // 1. the summary
  // 2. the html table
  // 3. the pdf table
  // hence we give them priority in that order, and provide sensible falbacks
  return {
    ...report,
    ...summary,
    pdf_url,
    report_url
  }
}
