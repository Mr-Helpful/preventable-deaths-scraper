const max_by = (xs, f) =>
  xs.reduce(
    ([x, v], y) => (f(y) > v ? [y, f(y)] : [x, v]),
    [undefined, -Infinity]
  )[0]

/** Returns the minimum number of edits to transform str1 into str2
 * @param {string} str1 the to transform
 * @param {string} str2 the target to transform to
 * @param {boolean} [ignore_case=false] whether to ignore case sensitivity
 * @returns {number[][]} the edit distance between all prefixes of str1 and str2
 */
function edit_distances(str1, str2, ignore_case = false) {
  // distances[i][j] = edits to get str1[0:i] to str2[0:j]
  let distances = Array.from({ length: str1.length + 1 }, _ =>
    Array(str2.length + 1).fill(0)
  )

  if (ignore_case) {
    str1 = str1.toLowerCase()
    str2 = str2.toLowerCase()
  }

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
function edit_distance(str1, str2, ignore_case = false) {
  // short circuit if strings are equal
  if (str1 === str2) return 0

  return edit_distances(str1, str2, ignore_case)[str1.length][str2.length]
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
function min_edit_slice(pat, text, ignore_case = false) {
  // short circuit if we find a perfect match
  const i = text.indexOf(pat)
  if (i !== -1) return { slice: pat, edits: 0, loc: [i, i + pat.length] }

  let edits = Infinity
  let slice = ''
  let loc = [0, 0]

  for (let i = 0; i < text.length - pat.length + 1; i++) {
    let text_slice = text.slice(i, i + pat.length)
    let distances = edit_distances(pat, text_slice, ignore_case)

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
export function min_edit_slices_match(
  pats,
  text,
  relative = false,
  ignore_case = false
) {
  let edits = Infinity
  let match = ''
  let slice = ''
  let loc = [0, 0]

  for (const pat of pats) {
    let min_result = min_edit_slice(pat, text, ignore_case)
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
function approx_contains_all(
  text,
  pattern,
  edits = 2,
  relative = 0.1,
  ignore_case = false
) {
  const text_words = text.split(/[^\w]+/g)
  const pattern_words = pattern.split(/[^\w]+/g)

  return pattern_words.every(pattern_word => {
    const error = Math.min(edits, Math.floor(pattern_word.length * relative))
    const match_found = text_words.some(word => {
      const distance = edit_distance(pattern_word, word, ignore_case)
      return distance <= error
    })
    return match_found
  })
}

export function to_keywords(text) {
  return text
    .split(/[^\w]+/g)
    .filter(word => word.length > 0)
    .filter(word => word[0].toUpperCase() === word[0])
    .join(' ')
}

/** Attempts to match area text against a possible list of matches
 * @template R
 * @template {{[key: string]: R}} T
 * @param {string} text the text to be corrected
 * @param {T} matches the list of strings to match against
 * @param {number} [edits=2] the maximum number of edits per word
 * @param {number} [relative=0.1] the maximum number of relative edits per word
 * @returns {T[keyof T] | undefined} the value for the match, or undefined if no good match
 */
export function try_matching(
  text,
  matches,
  edits = 2,
  relative = 0.2,
  ignore_case = false
) {
  const keys = Object.keys(matches)

  // first test a direct match
  const direct_match = keys.find(area => area === text)
  if (direct_match) return matches[direct_match]

  // then test whether text is a superset of an area,
  // up to 2 edits or 10% relative error per word
  // we take the longest such match to avoid false positives
  const superset_match = max_by(
    keys.filter(area =>
      approx_contains_all(text, area, edits, relative, ignore_case)
    ),
    match => match.length
  )
  if (superset_match) return matches[superset_match]
}

/** Attempts to match area text against a possible list of matches, giving earlier matches a higher priority
 * @template R
 * @template {{[key: string]: R}} T
 * @param {string} text the text to be corrected
 * @param {T[]} priority_matches the list of strings to match against
 * @param {number} [edits=2] the maximum number of edits per word
 * @param {number} [relative=0.1] the maximum number of relative edits per word
 * @returns {T[keyof T] | undefined} the value for the match, or undefined if no good match
 */
export function priority_match(
  text,
  priority_matches,
  edits = 2,
  relative = 0.2,
  ignore_case = false
) {
  for (const matches of priority_matches) {
    const match = try_matching(text, matches, edits, relative, ignore_case)
    if (match) return match
  }
}
