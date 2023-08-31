/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { useBlockProps } from "@wordpress/block-editor";

import ReportHeatMap from "./heatmap/ReportHeatmap.js";
import color_scales from "./heatmap/report-scales.json";
import { parse_csv, sum_columns } from "./helpers.js";

/** @typedef {{csv_text: string, source_url: string}} SaveBlockProps */

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
	const { csv } = parse_csv(attributes.csv_text);
	if (csv.length === 0) return <div>No Data</div>;

	const area_counts = sum_columns(csv);
	const max = Math.max(...Object.values(area_counts), 0);
	return (
		<div {...useBlockProps.save()}>
			<div
				className="report-heatmap-block"
				data-props={JSON.stringify(attributes)}
			>
				<ReportHeatMap
					area_counts={area_counts}
					max={max}
					scale={color_scales.custom}
				/>
			</div>
		</div>
	);
}
