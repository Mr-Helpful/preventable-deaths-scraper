/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { useBlockProps } from "@wordpress/block-editor";

import Papa from "papaparse";
import ReportHeatMap from "./heatmap/ReportHeatmap.js";
import color_scales from "./heatmap/report-scales.json";

/** @typedef {{csv_text: string, source_url: string}} SaveBlockProps */

/** Maps a function over the values of an object, leaving keys unaffected */
const object_map = (obj, fn) =>
	Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));

/** Sums the columns of a csv represented in a json format */
export const sum_columns = (csv) =>
	Object.fromEntries(
		Object.keys(csv[0] ?? {}).map((area) => [
			area,
			csv.reduce((a, b) => a + (b[area] ?? 0), 0),
		])
	);

export const max_columns = (csv) =>
	Object.fromEntries(
		Object.keys(csv[0] ?? {}).map((area) => [
			area,
			Math.max(...csv.map((row) => row[area] ?? 0), 0),
		])
	);

export const parse_csv = (text) => {
	let { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
	let csv = data.map((row) => object_map(row, parseInt));
	let years = csv.map(({ year }) => year);
	csv = csv.map(({ year, ...rest }) => rest);
	return { years, csv };
};

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized by the block
 * editor into `post_content`.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#save
 *
 * @return {WPElement} Element to render.
 */
export default function Save({ attributes }) {
	const csv = Papa.parse(attributes.csv_text, {
		header: true,
		skipEmptyLines: true,
	}).data;
	if (csv.length === 0) return <div>No Data</div>;

	const area_counts = sum_columns(csv);
	const max = Math.max(...Object.values(area_counts), 0);
	return (
		<div {...useBlockProps.save()}>
			<div className="report-heatmap-block" data-props={attributes}>
				<ReportHeatMap
					area_counts={area_counts}
					max={max}
					scale={color_scales.custom}
				/>
			</div>
		</div>
	);
}
