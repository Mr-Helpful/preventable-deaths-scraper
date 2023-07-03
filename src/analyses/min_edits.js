/*
Here we'll be using the minimum edit distance algorithm to _hopefully_ 
determine a reasonable regex for ignoring the parts that most coroner's reports 
have in common
*/

/** Calculates the edit distances for subsections of two strings
 *
 * [wikipedia](https://en.wikipedia.org/wiki/Edit_distance)
 *
 * The edit distances `distances` returned are s.t.
 * distances[j][i] is the edit distance between str1[:i] and str2[:j]
 * where the edit distance is defined as the minimum number of insertions,
 * deletions and substitutions to derive str2 from str1.
 *
 * @template T
 * @param {T[]} xs the first string to compare
 * @param {T[]} ys the second string to compare
 * @param {(x: T, y: T) => boolean} elem_eq
 * @return {number[][]} the edit distance array
 */
export function edit_distances(xs, ys, elem_eq = (x, y) => x === y) {
  let [w, h] = [xs.length, ys.length]
  let distances = Array.from({ length: h + 1 }, () =>
    Array.from({ length: w + 1 }, () => 0)
  )

  // fill in the edit distances for empty str1, str2
  for (let i = 1; i <= w; i++) {
    distances[0][i] = 1
  }
  for (let j = 1; j <= h; j++) {
    distances[j][0] = 1
  }

  // fill in other edit distances with dynamic programming
  for (let j = 1; j <= h; j++)
    for (let i = 1; i <= w; i++)
      if (elem_eq(xs[i - 1], ys[j - 1])) {
        distances[j][i] = distances[j - 1][i - 1]
      } else {
        distances[j][i] =
          Math.min(
            distances[j][i - 1],
            distances[j - 1][i],
            distances[j - 1][i - 1]
          ) + 1
      }

  return distances
}

export const str_edit_distance = (xs, ys) =>
  edit_distances(xs, ys).at(-1).at(-1)

/** Returns the index of the minimum member
 * @param {number[]} xs the values to compare
 * @returns {number} the minimum index
 */
function arg_min(xs) {
  let [j, m] = [0, Number.MAX_VALUE]
  for (const i in xs) {
    if (xs[i] < m) {
      m = xs[i]
      j = i
    }
  }
  return j
}

/** The type for edits on a string
 * - `insert`: insert the character given
 * - `delete`: delete the character at this point
 * - `change`: replace with the given character
 * - `leave`: maintain the current character
 */
const edit_types = ['change', 'delete', 'insert', 'leave']

/** Backtraces the edit distances to generate the minimum edits */
function edits(str1, str2) {
  const distances = edit_distances(str1, str2)
  let [i, j] = [str1.length, str2.length]
  let edits = []

  while (i > 0 || j > 0) {
    const steps = [
      [i - 1, j - 1],
      [i - 1, j],
      [i, j - 1]
    ]
    const values = steps.map(([i, j]) => distances[j][i])
    const next = arg_min(values)
    const [si, sj] = steps[next]

    edits.unshift(
      distances[j][i] === values[next]
        ? ['leave', str2[j - 1]]
        : [
            ['change', str2[j - 1]],
            ['delete', str1[i - 1]],
            ['insert', str2[j - 1]]
          ][next]
    )
    i = si
    j = sj
  }

  return edits
}

/** Attempts to naively cluster values by including values within a certain
 * distance of an existing cluster within that cluster.
 *
 * @template T
 * @param {T[]} strs the strings to attempt to cluster together
 * @param {number} min_distance a threshold at which a point is 'in' a cluster
 * @param {(x: T, y: T) => number} distance some form of distance metric on `T`
 * @return {T[][]} the resulting nested array of clusters
 */
function naive_clustering(strs, min_distance, distance) {
  let bar = new ProgressBar(':bar :percentage', strs.length)
  let clusters = []

  for (const str of strs) {
    const cluster = clusters.find(
      ({ elem }) => distance(elem, str) < min_distance
    )

    if (cluster !== undefined) cluster.all.push(str)
    else clusters.push({ elem: str, all: [str] })
    bar.tick()
  }

  return clusters.map(({ all }) => all)
}

export const naive_edit_clustering = (
  strs,
  min_distance,
  elem_eq = (x, y) => x === y
) =>
  naive_clustering(strs, min_distance, (x, y) => edit_distances(x, y, elem_eq))
