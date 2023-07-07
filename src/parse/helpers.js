/**
 * @template R
 * @callback Parser
 * @param {string[]} rows
 * @return {R | undefined}
 */
/**
 * @template O
 * @typedef {{[key: string]: keyof O}} HeadersFor
 */

/** Parses the section as if it were a list
 * The list may be:
 * 1. a numbered list (like this one)
 * 2. a bulleted list (either with `-`,`*` or `>`)
 * 3. a list separated by newlines
 * @param {string} list the string to parse
 * @return {string[]} the broken up list of strings
 */
export function parse_list(list) {
  const split_format = /\s*[-\*>]?\s*/g
  return list.split(split_format)
}

/** Creates a parser that recognises a table with headings
 * @template T
 * @param {HeadersFor<T>} headers the table heading regexes and their corresponding keys
 * @return {Parser<T>} the relevant parser
 */
export function table_parser(headers) {
  return function (text_rows) {
    const rows = text_rows
      .flatMap(row => row.split('\n\n'))
      .filter(row => row !== '')

    const entries = rows.flatMap(row =>
      Object.entries(headers).flatMap(([header, key]) => {
        const match = row.match(RegExp(`^\\s*(?:${header})\\s*(.*)`, 'si'))
        return match ? [[key, match[1]]] : []
      })
    )
    return Object.fromEntries(entries)
  }
}
