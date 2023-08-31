import { SVG } from "@wordpress/primitives";
import ReportMap from "./ReportMap.js";
import ReportScale from "./ReportScale.js";
import { forwardRef } from "react";

/**
 * @typedef {Object} ReportHeatmapProps
 * @property {{[area: string]: number}} area_counts the number of reports for each coroner area
 * @property {number} max the total number of reports
 * @property {{index: number, rgb: [number, number, number]}[]} scale a color scale
 */

/** @typedef {import("@wordpress/primitives").SVGProps} SVGProps */

/**
 * Renders a heatmap of the report frequencies for coroner areas
 * @param {ReportHeatmapProps & SVGProps} param0 the parameters for the ReportHeatmap component
 * @returns {WPElement}
 */
const ReportHeatmap = forwardRef(
	({ area_counts, max, scale, ...svg_props }, ref) => {
		return (
			<svg
				id="Report_Heatmap"
				ref={ref}
				data-name="Report Heatmap"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 647.73 680.32"
				width={630}
				height={680}
				role="group"
				aria-labelledby="Report_Heatmap_Title Report_Heatmap_Desc"
				{...svg_props}
			>
				<title id="Report_Heatmap_Title">Reports Heatmap</title>
				<desc id="Report_Heatmap_Desc">
					Heatmap of the report frequencies for coroner areas
				</desc>

				<g id="Report_Heatmap_Map">
					<ReportMap {...{ area_counts, max, scale }} />
				</g>

				<g id="Report_Heatmap_Scale" transform="translate(600 30)">
					<ReportScale {...{ max, scale }} />
				</g>
			</svg>
		);
	}
);

export default ReportHeatmap;
