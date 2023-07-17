import report_areas from "./report-areas.json";
import { color_at } from "./report-colorscales.js";

/**
 * @typedef {Object} ReportMapProps
 * @property {{[area: string]: number}} area_counts the number of reports for each coroner area
 * @property {number} max the total number of reports
 * @property {{index: number, rgb: [number, number, number]}[]} scale a color scale
 */

/**
 * Renders a map of the coroner areas, colored by the number of reports
 * @param {ReportMapProps} param0 the parameters for the ReportMap component
 * @returns {WPElement}
 */
const ReportMap = ({ area_counts, max, scale }) => {
	return report_areas.map(([id, name, d, transform]) => {
		return (
			<g key={id} role="listitem" aria-labelledby={`_${id}_Title`}>
				<title id={`_${id}_Title`}>
					{name}: {area_counts[name]} report
					{area_counts[name] === 1 ? "" : "s"}
				</title>

				<path
					id={`_${id}`}
					data-name={name}
					className="svg-coroner-area"
					fill={`rgb(${color_at(area_counts[name] / max, scale).join(" ")})`}
					d={d}
					transform={transform}
				></path>
			</g>
		);
	});
};

export default ReportMap;
