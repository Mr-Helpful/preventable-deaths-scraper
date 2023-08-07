import { re } from './helpers.js'

export const connectives = /and|or/gi
export const connective_words = re`\b${connectives}\b`
export const conjunctions = /and|or|of|the|for/gi
export const conjunctive_words = re`\b${conjunctions}\b`

/**
 * Returns the acronym of an organisation name
 * @param {string} organisation the organisation to convert
 * @returns {string} the acronym of the organisation
 */
export function to_acronym(organisation) {
  const words = organisation
    .trim()
    .split(/[^\w]+/g)
    .filter(word => !conjunctions.test(word))
  // if there's less than 3 words or there's an acronym
  // we probably shouldn't compress it further
  if (words.length < 3 || words.some(word => word === word.toUpperCase()))
    return organisation

  return words.map(word => word[0]).join('')
}
