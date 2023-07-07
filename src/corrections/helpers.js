export const max_by = (xs, f) =>
  xs.reduce(
    ([x, v], y) => (f(y) > v ? [y, f(y)] : [x, v]),
    [undefined, -Infinity]
  )[0]

/** Returns the minimum number of edits to transform str1 into str2
 * @param {string} str1 the to transform
 * @param {string} str2 the target to transform to
 * @returns {number[][]} the edit distance between all prefixes of str1 and str2
 */
export function edit_distances(str1, str2) {
  // distances[i][j] = edits to get str1[0:i] to str2[0:j]
  let distances = Array.from({ length: str1.length + 1 }, _ =>
    Array(str2.length + 1).fill(0)
  )

  // short circuit if strings are equal
  if (str1 === str2) return distances

  // distance from empty string to str2[0:j] is j
  for (let j = 0; j <= str2.length; j++) {
    distances[0][j] = j
  }

  for (let i = 1; i <= str1.length; i++) {
    distances[i][0] = i

    for (let j = 1; j <= str2.length; j++) {
      // identical characters
      if (str1[i - 1] === str2[j - 1]) {
        distances[i][j] = distances[i - 1][j - 1]
        continue
      }

      // transposed characters
      if (
        i > 1 &&
        j > 1 &&
        str1[i - 1] === str2[j - 2] &&
        str1[i - 2] === str2[j - 1]
      ) {
        distances[i][j] = distances[i - 2][j - 2] + 1
        continue
      }

      distances[i][j] =
        Math.min(
          distances[i - 1][j], // deletion
          distances[i][j - 1], // insertion
          distances[i - 1][j - 1] // substitution
        ) + 1
    }
  }

  return distances
}

/** Helper function for the edit distance of the full strings */
export function edit_distance(str1, str2) {
  // short circuit if strings are equal
  if (str1 === str2) return 0

  return edit_distances(str1, str2)[str1.length][str2.length]
}

/** Finds the pattern with the minimum edit distance to the text
 * @param {string[]} pats the patterns to search within
 * @param {string} text the text to search in
 * @param {boolean} [relative=false] whether to normalise the edit distance by the pattern length
 * @returns {{match: string, edits: number}} the pattern and the edit distance
 */
export function min_edits_match(pats, text, relative = false) {
  let edits = Infinity
  let match = ''

  for (const pat of pats) {
    let distance = edit_distance(pat, text)
    if (relative) distance /= pat.length
    if (distance < edits) {
      edits = distance
      match = pat

      // short circuit if we find a perfect match
      if (edits === 0) return { match, edits }
    }
  }

  return { match, edits }
}

/** Finds the slice of text that has the minimum edit distance to the pattern
 *
 * This is honestly a bit of a naive implementation, it acheives O(m^2 n) time,
 * whereas the more sophisticated implementations can acheive O(mn) time (using
 * weird bit tricks). However, we'll be using this only on short strings (< 50
 * characters), so it shouldn't matter too much.
 *
 * @param {string} pat the pattern to search for
 * @param {string} text the text to search in
 * @returns {{slice: string, edits: number, loc: [number, number]}}
 *    the slice, the edit distance and the location of the slice
 */
function min_edit_slice(pat, text) {
  // short circuit if we find a perfect match
  const i = text.indexOf(pat)
  if (i !== -1) return { slice: pat, edits: 0, loc: [i, i + pat.length] }

  let edits = Infinity
  let slice = ''
  let loc = [0, 0]

  for (let i = 0; i < text.length - pat.length + 1; i++) {
    let text_slice = text.slice(i, i + pat.length)
    let distances = edit_distances(pat, text_slice)

    for (const [j, distance] of distances[pat.length].entries()) {
      if (distance < edits) {
        edits = distance
        slice = text_slice.slice(0, j)
        loc = [i, i + j]
      }
    }
  }

  return { slice, edits, loc }
}

/** Finds the pattern with the minimum edit distance to a slice of the text
 * @param {string[]} pats the patterns to search within
 * @param {string} text the text to search in
 * @param {boolean} [relative=false] whether to normalise the edit distance by the pattern length
 * @returns {{match: string, slice: string, edits: number, loc: [number, number]}}
 *   the pattern, the slice, the edit distance and the location of the slice
 */
export function min_edit_slices_match(pats, text, relative = false) {
  let edits = Infinity
  let match = ''
  let slice = ''
  let loc = [0, 0]

  for (const pat of pats) {
    let min_result = min_edit_slice(pat, text)
    if (relative) min_result.edits /= pat.length
    if (min_result.edits < edits) {
      ;({ slice, edits, loc } = min_result)
      match = pat

      // short circuit if we find a perfect match
      if (edits === 0) return { match, slice, edits, loc }
    }
  }

  return { match, slice, edits, loc }
}

/** Tests whether the text contains all the words in another string, up to a
 * given edit distance or relative error distance per word
 * @param {string} text the string to test
 * @param {string } pattern the words to test for
 * @param {number} [edits=2] the maximum number of edits per word
 * @param {number} [relative=0.1] the maximum relative error per word
 * @returns {boolean} whether the text approximately contains all the words
 */
export function approx_contains_all(text, pattern, edits = 2, relative = 0.1) {
  const text_words = text.split(/[^\w]+/g)
  const pattern_words = pattern.split(/[^\w]+/g)
  // console.log(text_words, pattern_words)

  return pattern_words.every(pattern_word => {
    // console.log('> pattern =', pattern_word)
    const error = Math.min(edits, Math.floor(pattern_word.length * relative))
    // console.log('> error =', error)
    const match_found = text_words.some(word => {
      // console.log('>>', pattern_word, 'vs', word)
      const distance = edit_distance(pattern_word, word)
      // console.log('>> edits =', distance)
      return distance <= error
    })
    // console.log('> match found =', match_found)
    return match_found
  })
}
