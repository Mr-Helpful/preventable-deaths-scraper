import fs from 'fs/promises'

/** Writes to the log file with the number of pages and reports
 * @param {string} log_path the path of the logging file
 * @param {number} num_pages how many pages we found
 * @param {number} num_pages how many reports we found
 * @param {number} num_new the number of new reports discovered
 */
export async function write_log(log_path, num_pages, num_reports, num_new) {
  const date = new Date()
  await fs.writeFile(
    log_path,
    `Latest fetch on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}, for which:\n` +
      ` - ${num_pages} pages of reports were found\n` +
      ` - ${num_reports} total reports were found\n` +
      ` - ${num_new} new reports were found`
  )
}
