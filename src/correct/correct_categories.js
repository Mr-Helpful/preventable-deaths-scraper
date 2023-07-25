import fs from 'fs/promises'
import categories from './category_corrections.json' assert { type: 'json' }
import { priority_match } from './helpers.js'

/**
 * Creates a function that corrects the category to the closest match in the
 * preventable deaths list and saves the failed matches on close
 * @param {boolean} keep_failed whether to keep existing failed parses
 * @returns {Promise<import('.').CorrectFn<string>>}
 */
export default async function Corrector(keep_failed = true) {
  let { default: failed } = keep_failed
    ? await import('./data/failed_categories.json', {
        assert: { type: 'json' }
      })
    : { default: [] }

  function correct_category(text) {
    if (text === undefined || text.length === 0) return text

    return text
      .split(/\s*\|\s*/g)
      .flatMap(category => {
        // I'm using flatMap like a filterMap here.
        const match = priority_match(category, categories)
        if (match === undefined) failed.push(category)
        return match ? [match] : []
      })
      .join(' | ')
  }

  correct_category.close = () =>
    fs.writeFile(
      './src/correct/data/category_corrections.json',
      JSON.stringify(failed)
    )
  return correct_category
}
