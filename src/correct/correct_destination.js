import fs from 'fs/promises'
import { fetch_html, map_series } from '../fetch/helpers.js'
import { priority_match, try_matching } from './helpers.js'
import { get_initials, first_last_name, split_caps } from './simplify_name.js'
import { to_acronym } from './simplify_destination.js'

/*
Theres a bit of structure to the `this_report_is_being_sent_to` field, which we 
can use to attempt to automatically correct the recipients. The main thing 
we'll be relying on is that:
- if semi-colons are present, they will separate different recipients
- these recipients may be used in other reports, so we can use substring 
  matching to identify those
- if a recipient is present in some report, then its acronym may also be present
  in other reports (hence we should also check for acronyms of a recipient)
- if the removal of a substring match results in only connecting words / 
  punctuation, we can consider all parts matched
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
 * Creates a function that corrects the coroner name to the closest match in the
 * coroner society list and saves the failed matches on close
 * @param {boolean} keep_failed whether to keep existing failed parses
 * @returns {Promise<import('.').CorrectFn<string>>}
 */
export default async function Corrector(keep_failed = true) {
  const { default: manual_replace } = await import(
    './data/manual_destinations.json',
    { assert: { type: 'json' } }
  )
  let { default: found_replace } = await import(
    './data/found_destinations.json',
    { assert: { type: 'json' } }
  )

  const replacements = [
    ...replacements_from(found_replace),
    ...manual_replace.flatMap(replacements_from)
  ]

  let { default: failed } = keep_failed
    ? await import('./data/failed_names.json', { assert: { type: 'json' } })
    : { default: [] }

  /** @param {string} text */
  function correct_name(text) {
    if (text === undefined || text.length === 0) return text

    if (text.includes(';')) {
      const destinations = text.split(';').map(dest => dest.trim())
      found_replace.push(...destinations)
      return text
    }

    const match = priority_match(text, replacements, 2, 0.2, true)
    if (match === undefined) failed.push(text)
    return match
  }

  correct_name.close = async () =>
    Promise.all([
      fs.writeFile(
        './src/correct/data/failed_names.json',
        JSON.stringify(failed)
      ),
      fs.writeFile(
        './src/correct/data/merged_names.json',
        JSON.stringify(merge_failed(failed))
      )
    ])
  return correct_name
}
