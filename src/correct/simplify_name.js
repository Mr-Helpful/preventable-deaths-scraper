/**
 * Removes the [email protected] text from a name
 *
 * @param {string} name the name to strip
 * @returns {string} the name with email block removed
 */
export function remove_email_block(name) {
  return name.replace(/\[.*\]/g, '')
}

/*
Assumptions:
- titles either occur at the start or end of the name
- words that are 2/3 letters long and all capitals are likely titles
- initials are only used in the middle of the name

i.e. names follow the structure:
<start-title>* <first-name> <middle-name>* <last-name> <qualification>*
<start-title> = <qualification> | <title>
<first-name> = <last-name> = <name>
<middle-name> = <initial> | <name>

<qualification> = [A-Z]{2,3} // e.g. MD, QC, MBE, OBE
<title> = Mr|Mrs|Ms|Dr|Miss|Judge|Cdr|Justice|The|Hon // case insensitive
<initial> = [A-Z]\.?
<name> = [A-Za-z][a-z]+

and we want to extract:
<first-name> <last-name>
to match against

we'll also include matches for:
- intitals for the first name
- initials for the last name
*/

const title =
  'mr|mrs|ms|dr|miss|judge|cdr|justice|honourable|the|hon|frcpc|prof'
const title_regex = new RegExp(`\\s*\\b(?:${title})\\b\\s*`, 'gi')

const qualification = '[A-Z]{2,3}'
const qualification_regex = new RegExp(`\\s*\\b${qualification}\\b\\s*`, 'g')

/**
 * Simplifies a name to a first and last name
 * @param {string} name some name in `<start-title>* <first-name> <middle-name>* <last-name> <qualification>*` format
 * @returns {string} the simplified name in `<first-name> <last-name>` format
 */
export function simplify_name(name) {
  // remove all punctuation (i.e. `A. Mc'Nice-Cat.` -> `A Mc'Nice Cat`)
  name = name.replace(/[^\w']/g, ' ')
  // remove extra whitespace introduced by this
  name = name.replace(/\s+/g, ' ')
  // split on capitalised words (i.e. `A NiceCat` -> `A Nice Cat`)
  name = split_caps(name)
  // trim qualifications (i.e. `OBE FCP A Nice Cat MD` -> `A Nice Cat`)
  name = trimRegExp(name, qualification_regex)
  // remove titles (i.e. `Dr A Nice Cat` -> `A Nice Cat`)
  name = name.replace(title_regex, '')
  // remove unnecessary whitespace from simplification
  name = name.replace(/\s+/g, ' ')
  name = name.trim()

  name = extract_first_last(name)
  return to_camel_case(name)
}

/**
 * Splits a string on capitalised words
 * @param {string} text the text to split apart
 * @returns {string}
 */
export function split_caps(text) {
  return text.replace(/(?<=[a-z])[A-Z]/g, ' $&')
}

/**
 * Trims any occurences of a regex from the start and end of a string
 * @param {string} text the text to trim back
 * @param {string|RegExp} regex the regex to trim occurences of
 * @returns {string}
 */
function trimRegExp(text, regex) {
  let { source, flags } = new RegExp(regex)
  if (!flags.includes('g')) flags += 'g'
  return text.replace(new RegExp(`^(${source})*|(${source})*$`, flags), '')
}

/**
 * Extracts the first and last name from a name
 * @param {string} name the name to extract from
 * @returns {string} only the first and last name
 */
function extract_first_last(name) {
  const names = name.split(' ')
  if (names.length === 1) return name
  return `${names.at(0)} ${names.at(-1)}`
}

/**
 * Converts any words to camel case (i.e. first letter capitalised)
 * @param {string} name the name to convert
 * @return {string} the name in camel case
 */
function to_camel_case(name) {
  return name
    .split(/\s+/g)
    .filter(word => word.length > 0)
    .map(word => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Returns all possible initialisations of a name,
 * i.e. `John Smith` -> `J Smith`, `John S`
 * @param {string} name the name to initialise
 * @returns {string[]} the possible initialisations of the name
 */
export function get_initials(name) {
  // if less than 2 words, return
  const words = name.split(/\s+/g)
  if (words.length < 2) return []

  // if already initials, return
  const [first, last] = words
  if (first.length === 1 || last.length === 1) return []

  return [
    `${first[0].toUpperCase()} ${last}`,
    `${first} ${last[0].toUpperCase()}`
  ]
}

/**
 * Returns the surname of a name, assuming it is longer than 1 letter
 * @param {string} name the name to get the surname of
 * @returns {string[]} the surname
 */
export function get_surname(name) {
  const words = name.split(/\s+/g)
  if (words.length < 2) return []

  const [first, last] = words
  if (last.length === 1) return []

  return [name.split(/\s+/g).at(-1)]
}
