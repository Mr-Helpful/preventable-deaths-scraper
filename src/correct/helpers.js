import { try_matching } from './approx_match.js'

/**
 * Attempts to merge all unmatched names together, into the corrections needed
 * to match them all.
 *
 * We do this on the basis of:
 * - if a name roughly matches another name and is longer, we keep it
 * - if a name is the initials of another name, we keep the full name
 *
 * @param {string[]} texts the unmatched texts to merge together
 * @param {(field: string) => string[]} [simplify] generates simplified versions of the given field to merge
 * @return {string[]} the corrections needed to match the texts
 */
export function merge_failed(texts, simplify = field => [field]) {
  /** @type {{[key: string]: string}} */
  let corrections = {}

  for (const name of texts) {
    for (const possible of [name, ...simplify(name)]) {
      const match = try_matching(possible, corrections)
      // if we find an existing simplified match, remove it
      if (match !== undefined && match.length < possible.length) {
        delete corrections[match]
      }
    }

    corrections[name] = name
  }

  return Array.from(Object.keys(corrections))
}
