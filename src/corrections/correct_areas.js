import { fetch_html } from '../fetch/helpers.js'
import { max_by, approx_contains_all } from './helpers.js'
import fs from 'fs/promises'

/** Fetches the list of coroner areas from the coroner society website.
 *
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

function to_keywords(text) {
  return text
    .split(/[^\w]+/g)
    .filter(word => word.length > 0)
    .filter(word => word[0].toUpperCase() === word[0])
    .join(' ')
}

let areas = await fetch_area_list('https://www.coronersociety.org.uk/coroners/')
areas = Object.fromEntries(areas.map(area => [to_keywords(area), area]))

// manual corrections for a very small (<1%) of areas
let corrections = JSON.parse(
  await fs.readFile('./src/corrections/area_corrections.json', 'utf8')
)
corrections = Object.fromEntries(
  Object.entries(corrections).map(([k, v]) => [to_keywords(k), v])
)

/** Corrects the area name to the closest match in the coroner society list
 * @param {string} text the text to be corrected
 * @returns {string | undefined} the corrected area name or undefined if no good match
 */
export function correct_area(text) {
  if (text === undefined) return undefined
  return try_matching(text, areas) ?? try_matching(text, corrections) ?? text
}

/** Attempts to match area text against a possible list of areas
 * @param {string} text the text to be corrected
 * @param {Map<string, string>} areas the list of areas to match against
 * @returns {string | undefined} the matched area, or undefined if no good match
 */
function try_matching(text, areas) {
  const keys = Object.keys(areas)

  // first test a direct match
  const direct_match = keys.find(area => area === text)
  if (direct_match) return areas[direct_match]

  // then test whether text is a superset of an area,
  // up to 2 edits or 10% relative error per word
  // we take the longest such match to avoid false positives
  const superset_match = max_by(
    keys.filter(area => approx_contains_all(text, area, 2, 0.2)),
    match => match.length
  )
  if (superset_match) return areas[superset_match]
}
