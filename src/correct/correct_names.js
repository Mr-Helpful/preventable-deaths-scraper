import { fetch_html, map_async, map_series } from '../fetch/helpers.js'
import { try_matching } from './helpers.js'

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
 * Removes all titles from a name
 *
 * @param {string} name the name to strip
 * @returns {string} the name with titles removed
 */
function remove_titles(name) {
  const titles =
    /(Mr|Mrs|Ms|Dr|Miss|Judge|Cdr|Justice|The|Hon|HHJ|QC)(\s+\.?|$)/gi
  return name.replace(titles, '')
}

/**
 * Removes the [email protected] text from a name
 *
 * @param {string} name the name to strip
 * @returns {string} the name with email block removed
 */
function remove_email_block(name) {
  return name.replace(/\[.*\]/g, '')
}

const coroners = await fetch_name_list(
  'https://www.coronersociety.org.uk/coroners/'
)
const coroner_map = Object.fromEntries(
  coroners.map(({ name, ...coroner }) => {
    name = remove_email_block(name)
    return [remove_titles(name), { name, ...coroner }]
  })
)
console.log(coroner_map)

/** Corrects the coroner name to the closest match in the coroner society list
 * @param {string} text the text to be corrected
 * @returns {string | undefined} the corrected coroner name or the text if no good match
 */
export function correct_name(text) {
  if (text === undefined) return undefined
  return try_matching(text, coroner_map)?.name ?? text
}
