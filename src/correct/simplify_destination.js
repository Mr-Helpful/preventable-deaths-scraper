const connectives = /and|or|the/g

/**
 * Returns the acronym of an organisation name
 * @param {string} organisation the organisation to convert
 * @returns {string} the acronym of the organisation
 */
export function to_acronym(organisation) {
  if (is_acronym(organisation)) return organisation
  const words = organisation.trim().split(/[^\w]+/g)
  const first_letters = words
    .filter(word => !connectives.test(word))
    .map(word => word[0])
  return first_letters.join('')
}

/**
 * Tests whether a string only contains an acronym
 * @param {string} text the text to test
 * @returns {boolean} whether the text is an acronym
 */
export function is_acronym(text) {
  return text === text.toUpperCase() && !/[^\w]/g.test(text.trim())
}
