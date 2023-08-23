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
import { useEffect, useMemo, useState } from "@wordpress/element";

import { Flex, RangeControl } from "@wordpress/components";
import { RangeInput } from "./timescale-slider/slider.js";

const Playback = ({ min, max, setValue }) => {
	const [playing, setPlaying] = useState(false);
	return (
		<span
			width={50}
			height={50}
			className="dashicons dashicons-controls-play"
		></span>
	);
};

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

const max_columns = (csv) =>
	Object.fromEntries(
		Object.keys(csv[0] ?? {}).map((area) => [
			area,
			Math.max(...csv.map((row) => row[area] ?? 0), 0),
		])
	);

const parse_csv = (text) => {
	let { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
	let csv = data.map((row) => object_map(row, parseInt));
	let years = csv.map(({ year }) => year);
	csv = csv.map(({ year, ...rest }) => rest);
	return { years, csv };
};

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
				<Playback
					min={years[0]}
					max={years[csv.length - 1]}
					setValue={() => {}}
				/>
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
