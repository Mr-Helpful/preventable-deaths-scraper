import fs from 'fs/promises'
import { priority_match } from './approx_match.js'
import { merge_failed, load_correction_data } from './helpers.js'

/**
 * Creates a function that corrects the category to the closest match in the
 * preventable deaths list and saves the failed matches on close
 * @param {boolean} keep_failed whether to keep existing failed parses
 * @returns {Promise<import('.').CorrectFn<string>>}
 */
export default async function Corrector(keep_failed = true) {
  let { failed, incorrect, corrections } = await load_correction_data(
    'categories'
  )
  if (!keep_failed) failed = []

  function correct_category(text) {
    if (text === undefined || text.length === 0) return text

    return text
      .split(/\s*\|\s*/g)
      .flatMap(category => {
        if (category === undefined || category.length === 0) return []
        if (incorrect.has(category)) return []

        // I'm using flatMap like a filterMap here.
        const match = priority_match(category, corrections)
        if (match === undefined) failed.push(category)
        return match ? [match] : []
      })
      .join(' | ')
  }

  correct_category.close = () =>
    fs.writeFile(
      './src/correct/failed_parses/categories.json',
      JSON.stringify(merge_failed(failed), null, 2)
    )
  return correct_category
}
