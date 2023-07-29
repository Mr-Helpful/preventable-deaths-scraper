import fs from 'fs/promises'
import { try_matches, try_matching } from './approx_match.js'
import {
  conjunctions,
  connectives,
  to_acronym
} from './simplify_destination.js'

/* Assumptions

Theres a bit of structure to the `this_report_is_being_sent_to` field, which we 
can use to attempt to automatically correct the recipients. The main thing 
we'll be relying on is that:
- if semi-colons / vertical bars are present, they will separate different 
  recipients
- these recipients may be used in other reports, so we can use substring 
  matching to identify those
- if a recipient is present in some report, then its acronym may also be present
  in other reports (hence we should also check for acronyms of a recipient)
- if the removal of a substring match results in only connecting words / 
  punctuation, we can consider all parts matched
- if there are no connecting words / punctuation (i.e. `,`,`|`,`and`,`or`), we 
  can consider the whole field an unmatched name
*/

/**
 * Attempts to merge all unmatched names together, into the corrections needed
 * to match them all.
 *
 * We do this on the basis of:
 * - if a name roughly matches another name and is longer, we keep it
 * - if a name is the initials of another name, we keep the full name
 *
 * @param {string[]} names the unmatched names to merge together
 * @return {string[]} the corrections needed to match the names
 */
export function merge_failed(names) {
  /** @type {Set<string>} */
  let corrections = new Set()

  for (const name of names) {
    for (const possible of [name, to_acronym(name)]) {
      const match = try_matching(possible, corrections)
      // if we find an existing shorter match, remove it
      if (match !== undefined && match.simple.length < possible.length) {
        corrections.delete(match)
      }
    }

    corrections.add(name)
  }

  return Array.from(corrections.values())
}

/**
 * Calculates a list of possible replacements for a name map, with different
 * levels of simplification and priorities
 * @param {string[]} names a map from a simple to match name to the full name
 * @returns {{[key: string]: string}[]} a list of maps from a name to the full name, with different levels of simplification
 */
function replacements_from(names) {
  const name_map = names.map(name => [name, name])
  const acronyms = names.map(name => [to_acronym(name), name])

  // replacements have priority as so:
  // 1. match on full name
  // 2. match on acronym
  return [Object.fromEntries(name_map), Object.fromEntries(acronyms)]
}

/**
 * Tests whether a text only comprises of a list of names, up to connectives
 * and punctuation
 * @param {string} text the text to test the names against
 * @param {string[]} names the names to test
 * @returns {boolean} whether the text only contains the names
 */
function only_contains(text, names) {
  const names_words = new Set(names.flatMap(name => name.split(/[^\w]+/g)))
  const text_words = text
    .split(/[^\w]+/g)
    .filter(word => !conjunctions.test(word))
  return text_words.every(word => names_words.has(word))
}

/**
 * Attempts to match a list of names against a text, and only returns a match
 * if the text only contains the matched names (i.e. no other possible
 * organisation names are left unmatched)
 * @param {string} text the text to match names within
 * @param {string[]} names the organisation names to match against
 * @returns {string[] | undefined} the matches, or undefined if no good match
 */
function try_complete_matching(text, names) {
  const known_key_map = Object.fromEntries(names.map(name => [name, name]))
  const known_matches = try_matches(text, known_key_map, 2, 0.2)
  if (known_matches && only_contains(text, known_matches)) return known_matches
}

/**
 * Creates a function that corrects the coroner name to the closest match in the
 * coroner society list and saves the failed matches on close
 * @param {boolean} keep_failed whether to keep existing failed parses
 * @returns {Promise<import('./index.js').CorrectFn<string>>}
 */
export default async function Corrector(keep_failed = true) {
  const { default: manual_replacements } = await import(
    './manual_replace/destinations.json',
    { assert: { type: 'json' } }
  )
  let { default: known_replacements } = await import(
    './data/known_destinations.json',
    { assert: { type: 'json' } }
  )

  let { default: failed } = keep_failed
    ? await import('./failed_parses/destinations.json', {
        assert: { type: 'json' }
      })
    : { default: [] }

  /** @param {string} text */
  function correct_name(text) {
    if (text === undefined || text.length === 0) return text

    if (text.match(/[;|]/)) {
      const destinations = text.split(/[;|]/g).map(dest => dest.trim())
      for (const destination of destinations) {
        known_replacements[destination] = destination
        known_replacements[to_acronym(destination)] = destination
      }
      return text
    }

    // if there's no connectives or punctuation, we can just return the text
    if (!text.match(/[;|,]/) && !text.match(connectives)) {
      known_replacements[text] = text
      known_replacements[to_acronym(text)] = text
      return text
    }

    let names = []

    // first we check if manual names fully match the text
    // we prefer these over the known names, as they can be more accurate
    names.push(...Object.keys(manual_replacements))
    const manual_matches = try_complete_matching(text, names)
    if (manual_matches)
      return manual_matches.map(name => manual_replacements[name])

    // next we check if adding known names helps
    names.push(...Object.keys(known_replacements))
    const matches = try_complete_matching(text, names)
    if (matches)
      return matches.map(
        name => manual_replacements[name] ?? known_replacements[name]
      )

    // at this point, we have a field that we can't match
    failed.push(text)
  }

  correct_name.close = async () =>
    Promise.all([
      fs.writeFile(
        './src/correct/failed_parses/destinations.json',
        JSON.stringify(failed)
      ),
      fs.writeFile(
        './src/correct/data/known_destinations.json',
        JSON.stringify(known_replacements)
      )
    ])
  return correct_name
}
