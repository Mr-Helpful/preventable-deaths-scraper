import fs from 'fs/promises'
import { fetch_html } from '../fetch/helpers.js'
import corrections from './area_corrections.json' assert { type: 'json' }
import { to_keywords, try_matching } from './helpers.js'

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

let areas = await fetch_area_list('https://www.coronersociety.org.uk/coroners/')
areas = Object.fromEntries(areas.map(area => [to_keywords(area), area]))
await fs.writeFile(
  './src/data/areas.csv',
  'coroner_area\n' +
    Object.values(areas)
      .map(area => `"${area}"`)
      .join('\n')
)

/** Corrects the area name to the closest match in the coroner society list
 * @param {string} text the text to be corrected
 * @returns {string | undefined} the corrected area name or the text if no good match
 */
export function correct_area(text) {
  if (text === undefined) return undefined
  return try_matching(text, areas) ?? try_matching(text, corrections) ?? text
}
