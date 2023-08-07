import fs from 'fs/promises'
import {
  heirichic_matches,
  hierachic_match,
  try_matches
} from './approx_match.js'
import {
  conjunctions,
  conjunctive_words,
  connective_words,
  to_acronym
} from './simplify_destination.js'
import { merge_failed, load_correction_data } from './helpers.js'

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
  let { failed, incorrect, corrections } = await load_correction_data(
    'destinations'
  )
  if (!keep_failed) failed = []

  for (const correction of corrections) {
    for (const [key, value] of Object.entries(correction)) {
      const simple = key
        .replace(conjunctive_words, '')
        .replace(/[^\w']+/g, ' ')
        .trim()
      delete correction[key]
      correction[simple] = value
    }
  }
  if (corrections.length < 2) corrections.unshift({}, {})
  let known_replacements = corrections.slice(0, 2)

  /** @param {string} text */
  function correct_name(text) {
    if (text === undefined || text.length === 0) return undefined
    if (incorrect.has(text)) return undefined

    // if we have `;` or `|` in the text we can assume it's a well formed list
    if (text.match(/[;|]/)) {
      const destinations = text.split(/[;|]/g).map(dest => dest.trim())
      for (const destination of destinations) {
        const simple = destination.replace(conjunctive_words, '')
        known_replacements[0][simple] = destination
        known_replacements[1][to_acronym(simple)] = destination
      }
      return destinations.join(' | ')
    }

    // if there's no connectives or punctuation, we can just return the text
    if (!text.match(/[,]/) && !text.match(connective_words)) {
      const simple = text.replace(conjunctive_words, '')
      known_replacements[0][simple] = text
      known_replacements[1][to_acronym(simple)] = text
      return text
    }

    // remove conjunctions i.e. `and`, `or` as they get in the way of matching
    // const simple = text.replace(conjunctive_words, '')
    // const all_keys = corrections.flatMap(correction => Object.keys(correction))
    // let matches = heirichic_matches(simple, all_keys)
    // if (matches && only_contains(text, matches)) {
    //   const full_map = Object.assign({}, ...corrections)
    //   return matches
    //     .filter(match => match.length > 0)
    //     .map(match => full_map[match])
    //     .join('|')
    // }
    failed.push(text)
  }

  correct_name.close = async () => {
    await Promise.all([
      fs.writeFile(
        './src/correct/failed_parses/destinations.json',
        JSON.stringify(
          merge_failed(failed, dest => [to_acronym(dest)]),
          null,
          2
        )
      ),
      fs.writeFile(
        './src/correct/manual_replace/destinations.json',
        JSON.stringify(corrections, null, 2)
      )
    ])
  }
  return correct_name
}
