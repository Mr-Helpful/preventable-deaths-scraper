import React from "react";
import { createRoot } from "react-dom/client";

import ReportHeatMap from "./heatmap/ReportHeatmap.js";
import color_scales from "./heatmap/report-scales.json";
import { useEffect, useMemo, useState } from "@wordpress/element";
import { Flex, RangeControl } from "@wordpress/components";
// import { Playback } from "./Playback.js";
import { parse_csv, sum_columns, max_columns } from "./helpers.js";

/**
 * Dynamically Renders the saved content of the block.
 * We split this out to allow it to be rendered both in the editor and on the
 * frontend. As this has reactivity, it can't be used in the Save function.
 * @param {SaveBlockProps} props
 */
export function Front({ csv_text, source_url }) {
	// TODO: add time selection controls
	const parsed = useMemo(() => parse_csv(csv_text), [csv_text]);
	const [{ years, csv }, setData] = useState(parsed);
	const [index, setIndex] = useState(undefined);

	useEffect(() => {
		(async () => {
			const url = source_url;
			const response = await fetch(url);
			const text = await response.text();
			// if we're still on the same url, update the data
			if (url === source_url) setData(parse_csv(text));
		})();
	}, [source_url]);

	const area_counts = useMemo(
		() => (index === undefined ? sum_columns(csv) : csv[index]),
		[csv, index]
	);

	const max = useMemo(() => {
		const columns = index === undefined ? sum_columns(csv) : max_columns(csv);
		return Math.max(...Object.values(columns), 1);
	}, [csv]);

	return (
		<Flex direction={["column"]}>
			<Flex direction={["row"]} justify="space-between">
				{/* <Playback
					min={years[0]}
					max={years[csv.length - 1]}
					setValue={() => {}}
				/> */}
				<RangeControl
					initialPosition={0}
					min={years[0]}
					max={years[csv.length - 1]}
					withInputField={false}
					marks={years.map((year) => ({ value: year, label: "" }))}
				/>
			</Flex>

			<ReportHeatMap
				area_counts={area_counts}
				max={max}
				scale={color_scales.custom}
			/>
		</Flex>
	);
}

window.addEventListener("load", () => {
	const blocks = document.querySelectorAll(".report-heatmap-block");
	if (blocks.length === 0) return;

	for (const block of blocks) {
		const properties = JSON.parse(block.getAttribute("data-props"));
		createRoot(block).render(
			<div className="report-heatmap-block" data-props={properties}>
				<Front {...properties} />
			</div>
		);
	}
});
