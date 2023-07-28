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
import { useMemo } from "react";

import { MultiRangeSlider } from "two-thumb-range-slider";
import MultiRangeSlider2 from "multi-range-slider-react";
import MultiRangeSlider3 from "@saidaitdriss/multirangeslider";

/** @typedef {{csv_text: string, source_url: string}} SaveBlockProps */

/** Maps a function over the values of an object, leaving keys unaffected */
const object_map = (obj, fn) =>
	Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));

/**
 * Renders the saved content of the block.
 * We split this out to allow it to be rendered both in the editor, on the
 * server, and on the frontend.
 * @param {SaveBlockProps} props
 */
export function SaveBlock({ csv_text, source_url }) {
	// TODO: replace this with:
	// 1. CSVs loaded on the frontend (for freshness)
	// 2. Time selection controls
	const [csv_, setCsv] = useState([]);

	// this might be okay depending on how react tests if a returned value is a
	// cleanup function, otherwise it might try to call a promise as a function
	useEffect(async () => {
		const url = source_url;
		const response = await fetch(url);
		const text = await response.text();
		let { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
		const csv = data.map((row) => object_map(row, parseInt));
		// if we're still on the same url, update the csv
		if (url === source_url) setCsv(csv);
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
			<ReportHeatMap
				area_counts={area_counts}
				max={max}
				scale={color_scales.custom}
				className="report-heatmap-block"
				data-props={JSON.stringify({ csv_text, source_url })}
			/>
			<MultiRangeSlider min={0} max={1} value={[0, 1]} />
			<MultiRangeSlider2 min={0} max={1} value={[0, 1]} />
			<MultiRangeSlider3 min={0} max={1} value={[0, 1]} />
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
	return (
		<div {...useBlockProps.save()}>
			<SaveBlock {...attributes} />
		</div>
	);
}
