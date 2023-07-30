import fs from 'fs/promises'
import { ElementError, fetch_html } from '../fetch/helpers.js'
import corrections from './manual_replace/areas.json' assert { type: 'json' }
import { to_keywords, try_matching } from './approx_match.js'
import { merge_failed } from './helpers.js'

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
  await fs.writeFile('./src/correct/data/areas.json', JSON.stringify(areas))
  areas = Object.fromEntries(areas.map(area => [to_keywords(area), area]))

  let { default: failed } = keep_failed
    ? await import('./failed_parses/areas.json', {
        assert: { type: 'json' }
      })
    : { default: [] }

  function correct_area(text) {
    if (text === undefined || text.length === 0) return text

    const match = try_matching(text, areas) ?? try_matching(text, corrections)
    if (match === undefined) failed.push(text)
    return match ?? text
  }

  correct_area.close = () =>
    fs.writeFile(
      './src/correct/failed_parses/areas.json',
      JSON.stringify(merge_failed(failed))
    )
  return correct_area
}
