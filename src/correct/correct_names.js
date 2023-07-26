import fs from 'fs/promises'
import { fetch_html, map_series } from '../fetch/helpers.js'
import { priority_match, try_matching } from './helpers.js'
import {
  get_initials,
  remove_email_block,
  simplify_name,
  split_caps
} from './simplify_name.js'

/**
 * Fetches the list of page urls from the coroner society website
 *
 * @param {string} url the coroner society url
 * @returns {Promise<string[]>} the list of page urls
 */
async function fetch_page_urls(url) {
  const $ = await fetch_html(url)

  // determine how many pages we need to search and the urls for those pages
  const last_path = 'ul.paging > li.last > a'
  const last_url = $(last_path).attr('href')
  const last_num = Number(last_url.match(/\/coroners\/_\/(\d+)\//)[1])

  return Array.from({ length: last_num }, (_, i) => `${url}_/${i + 1}/`)
}

/**
 * Fetches the list of coroners from a coroner page
 *
 * @param {string} page_url the url of the coroner page to fetch names from
 * @returns {Promise<{name: string, title: string, role: string, email: string}[]>} the list of coroners on the page
 */
async function fetch_page(page_url) {
  const $ = await fetch_html(page_url)
  const people = $('ul.people > li')

  return people.get().map(person => {
    // fetches the name, title, role, and email of a coroner
    // role is a bit dodgy here, it can be an area, "Retired", "Honorary", etc
    // email may not always be present, but the rest seem consistent
    const elem = $(person)
    const name = elem.find('a').text()
    const [title, role] = elem
      .find('span')
      .get()
      .map(span => $(span).text())

    return { name, title, role }
  })
}

/**
 * Fetches the list of coroners from the coroner society website
 *
 * @param {string} url the coroner society url
 * @returns {Promise<{name: string, title: string, role: string, email: string}[]>} the list of coroners
 */
async function fetch_name_list(url) {
  const page_urls = await fetch_page_urls(url)
  const pages = await map_series(
    page_urls,
    fetch_page,
    'Fetching coroners |:bar| :current/:total pages'
  )
  return pages.flat()
}

/**
 * Attempts to merge all unmatched names together, into the corrections needed
 * to match them all.
 *
 * We do this on the basis of:
 * - if a name roughly matches another name and is longer, we keep it
 * - if a name is the initials of another name, we keep the full name
 *
 * @param {string[]} names the unmatched names to merge together
 * @return {{[key: string]: string}} the corrections needed to match the names
 */
export function merge_incorrect(names) {
  /** @type {{[key: string]: {name: string, simple: string}}} */
  const corrections = {}

  for (const name of names) {
    const simple = simplify_name(name)

    for (const possible of [simple, ...get_initials(simple)]) {
      const match = try_matching(possible, corrections)
      // if we find an existing shorter match, remove it
      if (match !== undefined && match.simple.length < possible.length) {
        delete corrections[match]
      }
    }

    corrections[simple] = { name, simple }
  }

  return Object.fromEntries(
    Object.entries(corrections).map(([simple, { name }]) => [simple, name])
  )
}

/**
 * Calculates a list of possible replacements for a name map, with different
 * levels of simplification and priorities
 * @param {{[key: string]: string}} full_name_map a map from a simple to match name to the full name
 * @returns {{[key: string]: string}[]} a list of maps from a name to the full name, with different levels of simplification
 */
function replacements_from(full_name_map) {
  const full_names = Object.entries(full_name_map)
  const short_names = full_names.map(([full_name, name]) => [
    simplify_name(full_name),
    name
  ])
  const initials = short_names.flatMap(([short_name, name]) =>
    get_initials(short_name).map(initial => [initial, name])
  )

  // replacements have priority as so:
  // 1. match on full name
  // 2. match on shortened name (first and last name only)
  // 3. match on initials
  return [
    full_name_map,
    Object.fromEntries(short_names),
    Object.fromEntries(initials)
  ]
}

/**
 * Creates a function that corrects the coroner name to the closest match in the
 * coroner society list and saves the failed matches on close
 * @param {boolean} keep_failed whether to keep existing failed parses
 * @returns {Promise<import('.').CorrectFn<string>>}
 */
export default async function Corrector(keep_failed = true) {
  const fetched = await fetch_name_list(
    'https://www.coronersociety.org.uk/coroners/'
  )
  const fetched_replace = Object.fromEntries(
    fetched.map(({ name }) => [remove_email_block(name), name])
  )
  const { default: manual_replace } = await import('./data/manual_names.json', {
    assert: { type: 'json' }
  })

  const replacements = [
    ...replacements_from(fetched_replace),
    ...manual_replace.flatMap(replacements_from)
  ]

  let { default: failed } = keep_failed
    ? await import('./data/failed_names.json', { assert: { type: 'json' } })
    : { default: [] }

  function correct_name(text) {
    if (text === undefined || text.length === 0) return text

    const name = split_caps(text)
    const match = priority_match(name, replacements, 2, 0.2, true)
    if (match === undefined) failed.push(text)
    return match?.name ?? text
  }

  correct_name.close = async () =>
    Promise.all([
      fs.writeFile(
        './src/correct/data/failed_names.json',
        JSON.stringify(failed)
      ),
      fs.writeFile(
        './src/correct/data/merged_names.json',
        JSON.stringify(merge_incorrect(failed))
      )
    ])
  return correct_name
}
