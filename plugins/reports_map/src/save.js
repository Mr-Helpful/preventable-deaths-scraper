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

export function SaveBlock({ csv_text }) {
	// TODO: replace this with:
	// 1. CSVs loaded on the frontend (for freshness)
	// 2. Time selection controls
	const csv = Papa.parse(csv_text, { header: true, skipEmptyLines: true }).data;
	if (csv.length === 0) return <div>No data</div>;
	const area_counts = Object.fromEntries(
		Object.entries(csv[0]).map(([area, count]) => [area, parseInt(count)])
	);
	const max = Math.max(...Object.values(area_counts), 0);
	return (
		<div
			className="report-heatmap-block"
			data-props={JSON.stringify({ csv_text })}
		>
			<ReportHeatMap
				area_counts={area_counts}
				max={max}
				scale={color_scales.custom}
			/>
		</div>
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
export default function Save({ attributes: { csv_text } }) {
	return (
		<div {...useBlockProps.save()}>
			<SaveBlock csv_text={csv_text} />
		</div>
	);
}
