import fs from 'fs/promises'
import {
  heirichic_matches,
  hierachic_match,
  max_by,
  non_words,
  try_matches
} from './approx_match.js'
import {
  conjunctions,
  conjunctive_words,
  connective_words,
  has_acronym,
  non_connective_words,
  to_acronym
} from './simplify_destination.js'
import { merge_failed, load_correction_data, re } from './helpers.js'

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

export const punctuation = re`${conjunctive_words}|[^\w'-]+`

const object_map = (obj, key_func = x => x, value_func = x => x) =>
  Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [key_func(k), value_func(v)])
  )

/**
 * Removes all matched segments from the text
 * @param {string} text the text to remove from
 * @param {{loc: [number, number]}[]} matches the matches to remove
 * @returns {string} text with the matches removed
 */
export function remove_matches(text, matches) {
  const [str, start] = matches.reduce(
    ([str, start], { loc: [s, e] }) => [str + text.slice(start, s), e],
    ['', 0]
  )
  return str + text.slice(start)
}

/**
 * Tests whether a text only comprises of a list of names, up to connectives
 * and punctuation
 * @param {string} text the text to test the names against
 * @param {{loc: [number, number]}[]} matches the names to test
 * @returns {boolean} whether the text only contains the names
 */
export function is_complete_match(text, matches) {
  const non_match = remove_matches(text, matches)
  const without_punctuation = non_match.replace(punctuation, '')
  return without_punctuation.length === 0
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

  if (corrections.length < 2) corrections.unshift({}, {})
  let known_replacements = [{}, {}]
  for (const key of Object.keys(corrections[0])) {
    if (!try_known_match(key)) add_to_known(key)
  }
  corrections[0] = known_replacements[0]
  corrections[1] = known_replacements[1]

  function try_known_match(text) {
    if (known_replacements[1][text]) return known_replacements[1][text]

    let replacements = [...corrections]
    replacements[1] = {} // don't try heirachic matches on acronyms
    replacements = Object.assign({}, ...replacements)
    const known_keys = Object.keys(replacements)
    const known_matches = hierachic_match(text, known_keys, {
      ignored_words: non_connective_words
    })
    if (known_matches === undefined) return undefined

    const known_match = max_by(known_matches, match => -match.error).phrase
    return replacements[known_match]
  }

  function add_to_known(text) {
    text = text.replace(non_words, ' ').trim()
    delete known_replacements[0][to_acronym(text)]
    known_replacements[0][text] = text
    if (to_acronym(text) !== text)
      known_replacements[1][to_acronym(text)] = text
  }

  /** @param {string} text */
  function correct_name(text) {
    if (text === undefined || text.length === 0) return undefined
    if (incorrect.has(text)) return undefined

    // if we have `;` or `|` in the text we can assume it's a well formed list
    if (text.match(/[;|]/)) {
      const destinations = text
        .split(/[;|]/g)
        .map(dest => dest.trim())
        .filter(dest => dest.length > 0)
      return destinations
        .map(dest => {
          const known_match = try_known_match(dest)
          if (known_match) return known_match
          add_to_known(dest)
          return dest
        })
        .join(' | ')
    }

    // if there's no connectives or punctuation, we can just return the text
    if (!text.match(/[,]/) && !text.match(connective_words)) {
      const known_match = try_known_match(text)
      if (known_match) return known_match
      add_to_known(text)
      return text
    }

    // if the text can be built from known matches and connectives, with only a
    // few errors, we can return those matches
    const replacements = Object.assign({}, ...corrections)
    const matches = heirichic_matches(text, Object.keys(replacements), {
      ignored_words: non_connective_words
    })
    if (matches && is_complete_match(text, matches))
      return matches.map(match => replacements[match.phrase]).join(' | ')

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
