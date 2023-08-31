/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from "@wordpress/i18n";

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { useBlockProps } from "@wordpress/block-editor";

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import "./edit.scss";

import {
	TextControl,
	FormFileUpload,
	Panel,
	PanelBody,
	PanelRow,
	PanelHeader,
	Button,
	Flex,
	FlexBlock,
	FlexItem,
} from "@wordpress/components";
import { useState, useMemo, useRef } from "@wordpress/element";
import { LiveHeatmap } from "./front.js";
import Papa from "papaparse";

/**
 * Converts a File object to a data url asynchronously
 * @param {File} file the file to read
 * @returns {Promise<string>} the data url for the file
 */
const read_to_url = (file) =>
	new Promise((resolve) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result);
		reader.readAsDataURL(file);
	});

/**
 * @typedef {Object} CsvComboSourceProps
 * @property {string} url The url of the csv file
 * @property {(url: string) => void} onChange A callback that is provided with the url and the parsed csv
 */

/**
 * An input that allows the user to load a csv from a file or external url
 * this will display a data url when the file is uploaded
 * @param {CsvComboSourceProps} param0 The parameters for the CSVInput component
 */
const CsvComboSource = ({ url, onChange, children }) => {
	const ref = useRef();
	return (
		<FormFileUpload
			accept="text/csv"
			variant="secondary"
			className="file-input"
			onChange={async ({ target: { files } }) => {
				if (files.length === 0) return;
				const url = await read_to_url(files[0]);
				ref.current.value = url;
				onChange(url);
			}}
		>
			{children}
			<TextControl
				type="url"
				ref={ref}
				defaultValue={url}
				className="csv-input"
				onClick={(e) => e.stopPropagation()}
				onChange={(url) =>
					fetch(url)
						.then((_) => {
							// TODO: make dialog flash on valid input
							onChange(url);
						})
						.catch((_) => {
							// TODO: We should only get network errors in here
							// maybe we want to notify the user of these errors
						})
				}
			/>
		</FormFileUpload>
	);
};

export const FileManager = ({ url, svg_html, onChange }) => {
	const svg_url = useMemo(() => {
		if (svg_html === undefined) return;
		const svgData = new Blob([svg_html], {
			type: "image/svg+xml;charset=utf-8",
		});
		return window.URL.createObjectURL(svgData);
	}, [svg_html]);

	return (
		<Flex>
			<CsvComboSource
				url={url}
				onChange={(url) => {
					if (url !== "") onChange(url);
				}}
			>
				{__("CSV Source", "reports-map")}
			</CsvComboSource>
			<Button variant="secondary" href={svg_url} download={"heatmap.svg"}>
				{__("Download SVG", "reports-map")}
			</Button>
		</Flex>
	);
};

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {WPElement} Element to render.
 */
export default function Edit({
	attributes: { csv_name, csv_text, source_url },
	setAttributes,
}) {
	const [svg_html, setSvgHtml] = useState(undefined);
	return (
		<div {...useBlockProps()}>
			<Panel>
				{/* Header and CSV loading */}
				<PanelHeader>
					<Flex direction={["row"]}>
						<FlexBlock>
							<h6>{__("Reports Heatmap", "reports-map")}</h6>
						</FlexBlock>
						<FlexItem>
							<FileManager
								url={source_url}
								onChange={async (url) => {
									const response = await fetch(url);
									const csv_text = await response.text();
									Papa.parse(csv_text, { header: true });
									setAttributes({ csv_text, source_url: url });
								}}
								svg_html={svg_html}
							/>
						</FlexItem>
					</Flex>
				</PanelHeader>
				{/* Preview Heatmap */}
				<PanelBody
					title={__("Preview", "reports-map")}
					initialOpen={false}
					buttonProps={{ disabled: csv_text.length === 0 }}
				>
					<PanelRow>
						<LiveHeatmap
							ref={(svg) => {
								if (svg === null) return;
								setSvgHtml(svg.outerHTML);
							}}
							csv_text={csv_text}
							source_url={source_url}
						/>
					</PanelRow>
				</PanelBody>
			</Panel>
		</div>
	);
}
