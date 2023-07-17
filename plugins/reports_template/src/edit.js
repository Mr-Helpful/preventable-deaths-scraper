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
import "./editor.scss";

import {
	TextControl,
	TabPanel,
	FormFileUpload,
	Panel,
	PanelBody,
	PanelRow,
	PanelHeader,
	Flex,
} from "@wordpress/components";
// import { SaveBlock } from "./save.js";

/**
 * Converts a File object to a data url asynchronously
 *
 * @param {File} file the file to read
 * @returns {Promise<string>} the data url for the file
 */
function read_to_url(file) {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result);
		reader.readAsDataURL(file);
	});
}

/**
 * A file input that converts the input to a data url
 *
 * @param {any} param0 The parameters for the CSVInput component
 * @param {({url: string, name: string}) => Promise<void>} param0.onChange A callback that is called when a file is uploaded
 * @returns {WPElement}
 */
const CsvFileSource = ({ name, onChange }) => {
	return (
		<Flex style={{ width: "auto" }}>
			<div className="file-name">{name}</div>
			<FormFileUpload
				accept="text/csv"
				variant="secondary"
				className="file-input"
				onChange={async ({ target: { files } }) => {
					if (files.length === 0) return;
					const url = await read_to_url(files[0]);
					await onChange({ url, name: files[0].name });
				}}
			>
				{__("Upload .csv File", "reports-map")}
			</FormFileUpload>
		</Flex>
	);
};

/**
 * A text input that validates the input as a url to the given content type
 *
 * @param {any} param0 The parameters for the CSVInput component
 * @param {({url: string, name: string}) => void} param0.onChange A callback that is provided with the url
 * @returns {WPElement}
 */
const CsvUrlSource = ({ onChange }) => {
	return (
		<TextControl
			type="url"
			label={__("Remote CSV Url", "reports-map")}
			className="csv-input"
			onChange={async (url) => {
				try {
					const response = await fetch(url);
					const type = response.headers.get("content-type");
					const disp = response.headers.get("content-disposition");
					console.log(disp);
					const name = disp.split(";")[1].split("=")[1];
					if (type && type.includes("text/csv")) {
						// TODO: make dialog flash on valid input
						onChange({ url, name });
					}
				} catch {
					// TODO: We should only get network errors in here
					// maybe we want to notify the user of these errors
				}
			}}
		/>
	);
};

/**
 * An input that allows the user to load a csv from a file or external url
 *
 * @param {any} param0 The parameters for the CSVInput component
 * @param {({url: string, name: string}) => void} param0.onChange A callback that is provided with the url and the parsed csv
 * @returns {WPElement}
 */
const CsvSource = ({ onChange }) => (
	<TabPanel
		tabs={[
			{
				name: "file",
				title: __("File Upload", "reports-map"),
				content: <CsvFileSource onChange={onChange} />,
			},
			{
				name: "url",
				title: __("External URL", "reports-map"),
				content: <CsvUrlSource onChange={onChange} />,
			},
		]}
		children={({ content }) => content}
	/>
);

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {WPElement} Element to render.
 */
export default function Edit({
	attributes: { csv_name, csv_text },
	setAttributes,
}) {
	return (
		<div {...useBlockProps()}>
			<Panel>
				{/* Header and CSV loading */}
				<PanelHeader>
					<h6>{__("Reports Heatmap", "reports-map")}</h6>
					<CsvFileSource
						name={csv_name}
						onChange={async ({ url, name }) => {
							const response = await fetch(url);
							const csv_text = await response.text();
							setAttributes({ csv_text, csv_name: name });
						}}
					/>
				</PanelHeader>
				{/* Preview Heatmap */}
				<PanelBody
					title={__("Preview", "reports-map")}
					initialOpen={false}
					buttonProps={{ disabled: csv_text.length === 0 }}
				>
					<PanelRow>{/* <SaveBlock csv_text={csv_text} /> */}</PanelRow>
				</PanelBody>
			</Panel>
		</div>
	);
}
