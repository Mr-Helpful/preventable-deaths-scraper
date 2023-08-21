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
import { useEffect, useState } from "@wordpress/element";

import { Flex } from "@wordpress/components";
import { RangeInput } from "./timescale-slider/slider.js";

/** @typedef {{csv_text: string, source_url: string}} SaveBlockProps */

/** Maps a function over the values of an object, leaving keys unaffected */
const object_map = (obj, fn) =>
	Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));

/** Sums the columns of a csv represented in a json format */
const sum_columns = (csv) =>
	Object.fromEntries(
		Object.keys(csv[0] ?? {}).map((area) => [
			area,
			csv.reduce((a, b) => a + (b[area] ?? 0), 0),
		])
	);

/**
 * Dynamically Renders the saved content of the block.
 * We split this out to allow it to be rendered both in the editor and on the
 * frontend. As this has reactivity, it can't be used in the Save function.
 * @param {SaveBlockProps} props
 */
export function Front({ csv_text, source_url }) {
	// TODO: replace this with:
	// 1. CSVs loaded on the frontend (for freshness)
	// 2. Time selection controls
	const [csv_, setCsv] = useState([]);

	// this might be okay depending on how react tests if a returned value is a
	// cleanup function, otherwise it might try to call a promise as a function
	useEffect(() => {
		(async () => {
			const url = source_url;
			const response = await fetch(url);
			const text = await response.text();
			let { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
			const csv = data.map((row) => object_map(row, parseInt));
			// if we're still on the same url, update the csv
			if (url === source_url) setCsv(csv);
		})();
	}, [source_url]);

	// const filtered = useMemo(() => csv_.filter({ year }), [csv_]);

	const csv = Papa.parse(csv_text, { header: true, skipEmptyLines: true }).data;
	if (csv.length === 0) return <div>No data</div>;
	const area_counts = Object.fromEntries(
		csv.map(({ coroner_area, count }) => [coroner_area, parseInt(count)])
	);
	const max = Math.max(...Object.values(area_counts), 0);

	return (
		<>
			<Flex direction={["column"]}>
				<ReportHeatMap
					area_counts={area_counts}
					max={max}
					scale={color_scales.custom}
					className="report-heatmap-block"
					data-props={JSON.stringify({ csv_text, source_url })}
				/>

				<RangeInput />
			</Flex>
		</>
	);
}

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

	const area_counts = Object.fromEntries(
		csv.map(({ coroner_area, count }) => [coroner_area, parseInt(count)])
	);
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
