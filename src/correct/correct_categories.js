import categories from './category_corrections.json' assert { type: 'json' }
import { priority_match } from './helpers.js'

/** Corrects the category to the closest match in the preventable deaths list
 * @param {string} text the text to be corrected
 * @returns {string | undefined} the corrected category or undefined if no good match
 */
export function correct_category(text) {
  if (text === undefined) return undefined
  return text
    .split('|')
    .map(category => priority_match(category, categories))
    .filter(match => match !== undefined)
    .join(' | ')
}
