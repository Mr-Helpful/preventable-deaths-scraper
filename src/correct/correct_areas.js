import fs from 'fs/promises'
import { ElementError, fetch_html } from '../fetch/helpers.js'
import { priority_match, to_keywords } from './approx_match.js'
import { merge_failed, load_correction_data } from './helpers.js'

/** Fetches the list of coroner areas from the coroner society website
 * @param {string} url the coroner society url
 * @returns {Promise<string[]>} the list of coroner areas
 */
async function fetch_area_list(url) {
  const $ = await fetch_html(url)
  const list_path = '#search_area > option'
  const list_rows = $(list_path)
  if (list_rows.length === 0) throw new ElementError('area list not found')

  return list_rows
    .get()
    .map(row => $(row).text())
    .filter(x => x !== 'Choose your area')
}

/**
 * Creates a function that corrects the area name to the closest match in the
 * coroner society list and saves the failed matches on close
 * @param {boolean} keep_failed whether to keep existing failed parses
 * @returns {Promise<import('.').CorrectFn<string>>}
 */
export default async function Corrector(keep_failed = true) {
  let areas = await fetch_area_list(
    'https://www.coronersociety.org.uk/coroners/'
  )
  await fs.writeFile(
    './src/correct/data/areas.json',
    JSON.stringify(areas, null, 2)
  )
  areas = Object.fromEntries(areas.map(area => [to_keywords(area), area]))

  let { failed, incorrect, corrections } = await load_correction_data('areas')
  if (!keep_failed) failed = []

  function correct_area(text) {
    if (text === undefined || text.length === 0) return undefined
    if (incorrect.has(text)) return undefined

    const match = priority_match(text, [areas, ...corrections])
    if (match === undefined) failed.push(text)
    return match
  }

  correct_area.close = () =>
    fs.writeFile(
      './src/correct/failed_parses/areas.json',
      JSON.stringify(merge_failed(failed), null, 2)
    )
  return correct_area
}
