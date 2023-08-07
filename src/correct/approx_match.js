const non_words = /[^\w']+/g

const max_by = (xs, f) =>
  xs.reduce(
    ([x, v], y) => (f(y) > v ? [y, f(y)] : [x, v]),
    [undefined, -Infinity]
  )[0]

/**
 * @typedef {Object} DistanceConfig
 * @property {number} addition_cost the cost of adding a character
 * @property {number} deletion_cost the cost of deleting a character
 * @property {number} substitution_cost the cost of substituting a character
 * @property {number} transposition_cost the cost of transposing two characters
 */
/** @type {DistanceConfig} */
const default_config = {
  addition_cost: 1,
  deletion_cost: 1,
  substitution_cost: 1,
  transposition_cost: 1
}

/** Returns the minimum number of edits to transform str1 into str2
 * @param {string} str1 the to transform
 * @param {string} str2 the target to transform to
 * @param {DistanceConfig} config the costs of each edit type
 * @returns {number[][]} the edit distance between all prefixes of str1 and str2
 */
function edit_distances(
  str1,
  str2,
  {
    addition_cost,
    deletion_cost,
    substitution_cost,
    transposition_cost
  } = default_config
) {
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

      let costs = [
        distances[i - 1][j] + deletion_cost, // deletion
        distances[i][j - 1] + addition_cost, // insertion
        distances[i - 1][j - 1] + substitution_cost // substitution
      ]

      // transposed characters
      if (
        i > 1 &&
        j > 1 &&
        str1[i - 1] === str2[j - 2] &&
        str1[i - 2] === str2[j - 1]
      ) {
        costs.push(distances[i - 2][j - 2] + transposition_cost)
      }

      distances[i][j] = Math.min(...costs)
    }
  }

  return distances
}

/** Helper function for the edit distance of the full strings */
function edit_distance(str1, str2, ignore_case = false) {
  if (ignore_case) {
    str1 = str1.toLowerCase()
    str2 = str2.toLowerCase()
  }

  // short circuit if strings are equal
  if (str1 === str2) return 0

  return edit_distances(str1, str2)[str1.length][str2.length]
}

/**
 * A generalised version of indexOf that works on any array-like object
 * @template {any[]|string} T
 * @param {T} xs the array to search in
 * @param {T} ys the array to search for
 * @return {number} the index of the first element of ys in xs, or -1 if not found
 */
function index_of(xs, ys) {
  let idxs = []
  for (let i = 0; i < xs.length; i++) {
    if (xs[i] === ys[0]) idxs.push(0)
    idxs = idxs.flatMap(idx => (xs[i] === ys[idx] ? [idx + 1] : []))
    if (idxs.includes(ys.length)) return i - ys.length + 1
  }
  return -1
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
 * @returns {{slice: string, error: number, errors: number[][], loc: [number, number]}}
 *    the slice, the edit distance, all distances and the location of the slice
 */
function min_edit_slice(pat, text, ignore_case = false) {
  if (ignore_case && typeof pat === 'string' && typeof text === 'string') {
    pat = pat.toLowerCase()
    text = text.toLowerCase()
  }

  // short circuit if we find a perfect match
  const i = index_of(text, pat)
  if (i !== -1)
    return {
      slice: pat,
      error: 0,
      errors: Array.from({ length: pat.length }, () =>
        Array(text.length).fill(0)
      ),
      loc: [i, i + pat.length]
    }

  let error = Infinity
  let errors = []
  let slice = ''
  let loc = [0, 0]

  for (let i = 0; i < text.length - pat.length + 1; i++) {
    let text_slice = text.slice(i)
    let distances = edit_distances(pat, text_slice, ignore_case)

    for (const [j, distance] of distances[pat.length].entries()) {
      if (distance < error) {
        errors = distances.map(row => row.slice(0, j))
        error = distance
        slice = text_slice.slice(0, j)
        loc = [i, i + j]
      }
    }
  }

  return { slice, error, errors, loc }
}

/** Finds the pattern with the minimum edit distance to a slice of the text
 * @param {string[]} to_match the patterns to search within
 * @param {string} text the text to search in
 * @param {boolean} [relative=false] whether to normalise the edit distance by the pattern length
 * @returns {{match: string, slice: string, error: number, loc: [number, number]}}
 *   the pattern, the slice, the edit distance and the location of the slice
 */
export function min_edit_slices_match(
  to_match,
  text,
  relative = false,
  ignore_case = false
) {
  if (ignore_case) text = text.toLowerCase()
  let error = Infinity
  let match = ''
  let slice = ''
  let loc = [0, 0]

  for (const pat of to_match) {
    if (ignore_case) pat = pat.toLowerCase()
    let min_result = min_edit_slice(pat, text, ignore_case)
    if (relative) min_result.error /= pat.length
    if (min_result.error < error) {
      ;({ slice, error, loc } = min_result)
      match = pat

      // short circuit if we find a perfect match
      if (error === 0) return { match, slice, error, loc }
    }
  }

  return { match, slice, error, loc }
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
  const text_words = text.split(non_words)
  const pattern_words = pattern.split(non_words)

  return pattern_words.every(pattern_word => {
    const error = Math.min(edits, Math.floor(pattern_word.length * relative))
    const match_found = text_words.some(word => {
      // short circuit if the difference in length is too great
      if (Math.abs(word.length - pattern_word.length) > error) return false
      // short circuit if no error is allowed and the words are different
      if (error === 0 && word !== pattern_word) return false
      const distance = edit_distance(pattern_word, word, ignore_case)
      return distance <= error
    })
    return match_found
  })
}

export function to_keywords(text) {
  return text
    .split(non_words)
    .filter(word => word.length > 0)
    .filter(word => word[0].toUpperCase() === word[0])
    .join(' ')
}

/** Attempts to match area text against a possible list of matches
 * @template R
 * @param {string} text the text to be corrected
 * @param {{[key: string]: R}} to_match the list of strings to match against
 * @param {number} [edits=2] the maximum number of edits per word
 * @param {number} [relative=0.1] the maximum number of relative edits per word
 * @returns {R[] | undefined} possible matches or undefined if no good match
 */
export function try_matches(
  text,
  to_match,
  edits = 2,
  relative = 0.2,
  ignore_case = false
) {
  const keys = Object.keys(to_match)

  // first test a direct match
  const direct_match = keys.find(area => area === text)
  if (direct_match) return [to_match[direct_match]]

  // then test whether text is a superset of an area,
  // up to 2 edits or 10% relative error per word
  // we take the longest such match to avoid false positives
  const superset_match = keys.filter(area =>
    approx_contains_all(text, area, edits, relative, ignore_case)
  )
  if (superset_match.length > 0)
    return superset_match.map(match => to_match[match])
}

/** Attempts to match area text against a possible list of matches
 * @template R
 * @param {string} text the text to be corrected
 * @param {{[key: string]: R}} to_match the list of strings to match against
 * @param {number} [edits=2] the maximum number of edits per word
 * @param {number} [relative=0.1] the maximum number of relative edits per word
 * @returns {R | undefined} the value for the match, or undefined if no good match
 */
export function try_matching(
  text,
  to_match,
  edits = 2,
  relative = 0.2,
  ignore_case = false
) {
  const matches = try_matches(text, to_match, edits, relative, ignore_case)
  if (matches) return max_by(matches, match => match.length)
}

/** Attempts to match area text against a possible list of matches, giving earlier matches a higher priority
 * @template R
 * @param {string} text the text to be corrected
 * @param {{[key: string]: R}[]} match_list the list of strings to match against
 * @param {number} [edits=2] the maximum number of edits per word
 * @param {number} [relative=0.1] the maximum number of relative edits per word
 * @returns {R | undefined} the value for the match, or undefined if no good match
 */
export function priority_match(
  text,
  match_list,
  edits = 2,
  relative = 0.2,
  ignore_case = false
) {
  for (const matches of match_list) {
    const match = try_matching(text, matches, edits, relative, ignore_case)
    if (match) return match
  }
}

/**
 * Tests whether a text only comprises of a list of names, up to connectives
 * and punctuation
 * @param {string} text the text to test the names against
 * @param {string[]} names the names to test
 * @returns {boolean} whether the text only contains the names
 */
function only_contains(text, names) {
  const names_words = new Set(names.flatMap(name => name.split(non_words)))
  const text_words = text.split(non_words)
  return text_words.every(word => names_words.has(word))
}

/**
 * Attempts to match a list of replacements against a text, and only returns a
 * match if the text only contains the matched keys (i.e. no other possible
 * keys are left unmatched)
 * @param {string} text the text to match names within
 * @param {{[key: string]: string}[]} to_match replacements to match against
 * @returns {string[] | undefined} the matches, or undefined if no good match
 */
export function try_complete_matching(text, to_match) {
  const key_map = Object.fromEntries(Object.keys(to_match).map(k => [k, k]))
  const matches = try_matches(text, key_map, 2, 0.2)
  if (matches && only_contains(text, matches))
    return matches.map(match => to_match[match])
}

/**
 * Takes a list of replacements to match against, and returns the first match
 * that is complete, extending the list of replacements if necessary
 * @param {string} text the text to match names within
 * @param {{[key: string]: string}[]} to_match_list list of replacements to match against
 * @returns {string[] | undefined} the matches, or undefined if no good match
 */
export function priority_complete_matching(text, to_match_list) {
  let to_match = {}
  for (const new_matches of to_match_list) {
    Object.assign(to_match, new_matches)
    const match = try_complete_matching(text, to_match)
    if (match) return match
  }
}

/**
 * @typedef {Object} ErrorConfig
 * @property {number} typos the maximum number of typos allowed
 * @property {number} relative the maximum relative error allowed
 */

/** @type {ErrorConfig} */
const default_error_config = {
  ...default_config,
  typos: 2,
  relative: 0.2
}

/**
 * Attempts to find a match for a text within a list of phrases, using the
 * following method:
 * If there are sufficiently few edits in words, ignoring any replacements that
 * have fewer than `word_typos` typos, then we accept the match.
 *
 * @param {string} text the text to match against
 * @param {string[]} to_match the list of strings to match against
 * @param {ErrorConfig} config the edit distance config for the words that make up the phrase
 * @param {ErrorConfig} word_config the edit distance config for the letter that make up each word
 * @returns {{phrase: string, loc: [number, number], error: number}[] | undefined} the matches, or undefined if no good match
 */
export function hierachic_match(
  text,
  to_match,
  config = default_error_config,
  word_config = default_error_config
) {
  const words = text.split(non_words)
  const word_matches = to_match.flatMap(phrase => {
    const match_words = phrase.split(non_words)
    const diff = words.length - match_words.length
    if (diff > 0 && diff * config.deletion_cost > config.typos) return []
    if (diff < 0 && -diff * config.addition_cost > config.typos) return []

    let { error, errors, loc } = min_edit_slice(words, match_words, config)
    if (error <= config.typos && error <= words.length * config.relative)
      return [{ phrase, loc, error }]

    // check if any replacement words are close enough
    let i = errors.length - 1
    let j = (errors[0] ?? []).length - 1
    while (i > 0 && j > 0) {
      // if there's a transposition, skip it
      if (
        i > 1 &&
        j > 1 &&
        words[i - 1] === match_words[j - 2] &&
        words[i - 2] === match_words[j - 1] &&
        errors[i][j] === errors[i - 2][j - 2] + word_config.transposition_cost
      ) {
        i -= 2
        j -= 2
        continue
      }

      const min = Math.min(
        errors[i][j - 1], // addition
        errors[i - 1][j], // deletion
        errors[i - 1][j - 1] // replacement
      )
      if (min === errors[i - 1][j]) i--
      else if (min === errors[i][j - 1]) j--
      else {
        const word = words[i - 1]
        const match_word = match_words[j - 1]
        const errors = edit_distances(word, match_word, word_config)
        const word_error = errors[word.length][match_word.length]

        // if a replacement is close enough, don't consider it a replacement
        // if this brings us below the allowable phrase typos, then it's a match
        if (
          word_error > 0 &&
          word_error <= word_config.typos &&
          word_error <= words.length * word_config.relative
        ) {
          console.log(
            `${word} is close enough (${word_error}) to ${match_word}`
          )
          error -= word_config.substitution_cost
          if (error < config.typos && error < words.length * config.relative)
            return [{ phrase, loc, error }]
        }

        i--
        j--
      }
    }

    return []
  })

  if (word_matches.length > 0) return word_matches
}

/**
 *
 * @param {string} text
 * @param {string[]} to_match
 * @param {DistanceConfig & {typos: number}} phrase_config
 * @param {DistanceConfig & {typos: number}} word_config
 */
export function heirichic_matches(
  text,
  to_match,
  phrase_config = { typos: 2, ...default_config },
  word_config = { typos: 2, ...default_config }
) {
  const matches = hierachic_match(text, to_match, phrase_config, word_config)
  if (matches === undefined) return undefined
  // basic greedy algorithm:
  // find the lowest error at each position and ignore the others
  matches.sort((a, b) => a.error - b.error)
  matches.sort((a, b) => a.loc[0] - b.loc[0])
  console.log(
    matches.map(({ phrase, error, loc }) => [
      phrase,
      error,
      text
        .split(non_words)
        .slice(...loc)
        .join(' ')
    ])
  )

  let start = 0
  for (let i = 0; i < matches.length; i++) {
    if (matches[i].loc[0] < start) {
      matches.splice(i, 1)
      i--
    } else {
      start = matches[i].loc[1]
    }
  }
  return matches.map(({ phrase }) => phrase)
}
