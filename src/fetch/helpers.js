import ProgressBar from 'progress'
import { load } from 'cheerio/lib/slim'
import pdfjs from 'pdfjs-dist'

/**
 * @typedef {import('pdfjs-dist').PDFPageProxy} PDFPageProxy
 */

export class NetworkError extends Error {
  name = 'NetworkError'

  /**
   * @param {Error} err the error to generate from
   * @param {string} url the url we attempted to fetch
   * @returns {NetworkError}
   */
  static from(err, url) {
    return new NetworkError(`Error fetching ${url}: ${err.msg}`, { cause: err })
  }
}

export class ElementError extends Error {
  name = 'ElementError'
}

/** Wrapper to run the fetch n times, in case the first doesn't work
 * @throws {TypeError} a network error
 * @param {RequestInfo} url the url of the content to fetch
 * @param {number} n the number of retries to make
 * @param {RequestInit} init the initialisation options for fetch
 * @return {Promise<Response>} the result from the url
 */
export async function retry_fetch(url, n = 50, init = {}) {
  let err
  for (let i = 0; i < n; i++)
    try {
      return await fetch(url, init)
    } catch (e) {
      err = e
    }
  throw NetworkError.from(err, url)
}

/** Fetches a webpage and loads it with the cheerio library
 * @throws {NetworkError}
 * @param {string} url the url of the page to fetch
 * @return {Promise<CheerioAPI>} the parsed html document
 */
export async function fetch_html(url) {
  const data = await retry_fetch(url)
  const text = await data.text()
  return load(text)
}

/** Retrieves the text content from a page, adding newlines as necessary
 * @param {PDFPageProxy} page the pdf page to read text from
 * @returns {Promise<string>} the text retrieved from the page
 */
async function load_page(page) {
  const content = await page.getTextContent()
  let y,
    text = ''

  for (const { str, transform } of content.items) {
    text += y && y !== transform[5] ? '\n' + str : str
    y = transform[5]
  }

  return text
}

/** Reads the text from multiple pages of a pdf, separating pages with a `\n\n`
 * @param {ArrayBuffer} data the array buffer to read as a pdf
 * @param {number} verbosity the debug level to pass to pdf.js
 * @return {Promise<string>} the text content of the pdf
 */
async function load_pdf(data, verbosity = 0) {
  const doc = await pdfjs.getDocument({ data, verbosity }).promise
  const pages = Array.from({ length: doc.numPages }, (_, i) =>
    doc.getPage(i).then(load_page)
  )
  await doc.destroy()
  return (await Promise.all(pages)).join('\n\n')
}

/** Fetches a pdf and loads it with the pdf-parse library
 * @throws {NetworkError}
 * @param {string} url the url of the pdf to fetch
 * @return {Promise<string>} the parsed pdf document
 */
export async function fetch_pdf(url) {
  const data = await retry_fetch(url)
  const buff = await data.arrayBuffer()
  return await load_pdf(buff)
}

/** Explicitly adds the `map_async` method to the Array scope */
export function array_methods() {
  /** Maps a common async function in parallel on a list of data, updating a
   * progress bar when each of the tasks finish.
   * @template T, R
   * @param {T[]} data the data to be processed
   * @param {(d: T) => Promise<R>} func the task to be performed
   * @param {string} msg the message format for the progress bar to use
   * @return {Promise<R[]>} the result of applying func to all of the data
   */
  Array.prototype.map_async = function map_async(func, msg = ':progress') {
    const progress = new ProgressBar(msg, this.length)
    return Promise.all(
      this.map(async d => {
        const res = await func(d)
        progress.tick()
        return res
      })
    )
  }
}
