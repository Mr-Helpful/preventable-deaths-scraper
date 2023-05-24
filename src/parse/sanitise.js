const replacements = [
  ['’', "'"],
  ['‘', "'"],
  ['“', '"'],
  ['”', '"'],
  [' ', ''],
  ['­', ''],
  ['–', '-']
]

/** Makes all replacements in a given text
 * @param {string} text the string to make replacements in
 * @returns {string} the string with all replacements made
 */
const sanitise_replace = text =>
  replacements.reduce(
    (text, [match, subst]) => text.replaceAll(match, subst),
    text
  )

const escaped = [['"', '""']]

/** Escapes any characters that cause problems in .csv files
 * @param {string} text the string to escape characters in
 * @returns {string}
 */
const sanitise_escape = text =>
  escaped.reduce((text, [match, subst]) => text.replaceAll(match, subst), text)

/** Attempts to remove any invalid/unexpected characters from the text
 * @param {string} text the string to attempt to sanitise
 * @returns {string} the string sanitised for use in a .csv file
 */
export function sanitise_text(text) {
  return sanitise_escape(sanitise_replace(text))
}
