import fs from 'fs/promises'
import { sanitise_text } from '../parse/index.js'

/** Creates a .csv file at the file path and adds headers if it doesn't exist
 * @param {string} csv_path where to attempt to create the .csv
 * @param {string[]} headers the headers to be used in the csv
 */
export async function try_create_csv(csv_path, headers) {
  const rewrite =
    (await fs.access(csv_path).catch(_ => true)) ??
    (await fs.readFile(csv_path)).length === 0
  if (rewrite) await fs.writeFile(csv_path, headers.join(',') + '\n')
}

/** Appends a single object to the given csv file, assuming the given headers
 * @param {string} object the object to write in a new line
 * @param {string} csv_path the file to append the report to
 * @param {string[]} headers the headers for each column of data
 */
export async function append_csv_row(object, csv_path, headers) {
  const row = headers
    .map(header => object[header] ?? '')
    .map(s => `"${sanitise_text(s)}"`)
    .join(',')
  await fs.appendFile(csv_path, row + '\n')
}
