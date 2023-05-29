import { fetch_html, map_async } from './helpers.js'
import { parse } from 'csv-parse/sync'
import fs from 'fs/promises'

/** Determines the urls of all the pages we need to search
 * @param {string} report_url the prevention of death reports page
 * @return {Promise<string[]>} the page urls to be loaded
 */
export async function fetch_page_urls(report_url) {
  const $ = await fetch_html(report_url)

  // determine how many pages we need to search and the urls for those pages
  const link_path = 'a.page-numbers'
  const nums = $(link_path)
    .get()
    .map(link => Number($(link).text()))
    .filter(isFinite)

  return Array.from(
    { length: Math.max(...nums) },
    (_, i) => `${report_url}page/${i + 1}/`
  )
}

/** Determines the urls of all reports that need to be loaded from a single page
 * @param {string} page_url the page to get report urls from
 * @return {Promise<string[]>} the urls from the page
 */
async function fetch_urls_from_page(page_url) {
  const $ = await fetch_html(page_url)

  // add all links on the page to the urls array
  const link_path = 'h3.card__title > a.card__link'
  return $(link_path)
    .get()
    .map(link => $(link).attr('href'))
}

/** Determines the urls of all reports that need to be loaded
 * @param {string[]} page_urls the urls of all pages to fetch reports from
 * @return {Promise<string[]>} the report urls to be loaded
 */
export async function fetch_all_urls(page_urls) {
  return (
    await map_async(
      page_urls,
      fetch_urls_from_page,
      'Fetching urls |:bar| :current/:total pages'
    )
  ).flat()
}

/** Finds all reports already present in our csv
 * @param {string} file_path the path to our reports csv
 * @return {Promise<string[]>} all urls that we've already seen
 */
export async function fetch_seen_urls(file_path) {
  const text = await fs.readFile(file_path, 'utf8')
  const records = parse(text, { columns: true })
  return records.map(row => row.report_url)
}

/** Fetches the urls for all reports that haven't already been seen
 * @param {string[]} page_urls the pages that reports are fetched from
 * @param {string} file_path the path of the csv file for reports
 * @return {Promise<string[]>} all urls that we haven't seen
 */
export async function fetch_unseen_urls(page_urls, file_path) {
  const seen_urls = new Set(await fetch_seen_urls(file_path))
  return (await fetch_all_urls(page_urls)).filter(url => !seen_urls.has(url))
}
