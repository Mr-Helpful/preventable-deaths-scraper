import Papa from "papaparse";

/** Maps a function over the values of an object, leaving keys unaffected */
export const object_map = (obj, fn) =>
	Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));

/** Sums the columns in a json csv format */
export const sum_columns = (csv) =>
	Object.fromEntries(
		Object.keys(csv[0] ?? {}).map((area) => [
			area,
			csv.reduce((a, b) => a + (b[area] ?? 0), 0),
		])
	);

/** Finds the maximum of columns in a json csv format */
export const max_columns = (csv) =>
	Object.fromEntries(
		Object.keys(csv[0] ?? {}).map((area) => [
			area,
			Math.max(...csv.map((row) => row[area] ?? 0), 0),
		])
	);

/**
 * Parses a csv in a { year, area1, area2, ... }[] format into the
 * { years: number[], csv: { area1, area2, ... }[] } format.
 * Ignores any empty lines and expects a header row.
 * @param {string} text the text of the csv
 * @returns {{years: number[], csv: Object[]}} the parsed csv
 */
export const parse_csv = (text) => {
	let { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
	let csv = data.map((row) => object_map(row, parseInt));
	let years = csv.map(({ year }) => year);
	csv = csv.map(({ year, ...rest }) => rest);
	return { years, csv };
};
