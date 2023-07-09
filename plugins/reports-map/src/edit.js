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

import { TextControl, TabPanel, FormFileUpload } from "@wordpress/components";
import { useState } from "@wordpress/element";

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
 * @param {(url: string, csv: any[]) => void} param0.onChange A callback that is called when a file is uploaded
 * @returns {WPElement}
 */
const CsvFileSource = ({ onChange }) => (
	<FormFileUpload
		accept="text/csv"
		variant="secondary"
		className="file-input"
		onChange={async ({ target: { files } }) => {
			console.log(files[0]);
			const url = await read_to_url(files[0]);
			console.log(url);
			onChange(url);
		}}
	>
		{__("Upload .csv File", "reports-map")}
	</FormFileUpload>
);

/**
 * A text input that validates the input as a url to the given content type
 *
 * @param {any} param0 The parameters for the CSVInput component
 * @param {(url: string, csv: any[]) => void} param0.onChange A callback that is provided with the url and the parsed csv
 * @returns {WPElement}
 */
const CsvUrlSource = ({ onChange }) => {
	const [valid, setValid] = useState(false);

	return (
		<TextControl
			type="url"
			label={__("Remote Url", "reports-map")}
			className="csv-input"
			onChange={async (url) => {
				try {
					const response = await fetch(url);
					const type = response.headers.get("content-type");
					setValid(type && type.includes("text/csv"));
					onChange(url);
				} catch {
					setValid(false);
				}
			}}
		/>
	);
};

/**
 * An input that allows the user to load a csv from a file or external url
 *
 * @param {any} param0 The parameters for the CSVInput component
 * @param {(url: string, csv: any[]) => void} param0.onChange A callback that is provided with the url and the parsed csv
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
		children={(tab) => tab.content}
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
export default function Edit({ setAttributes }) {
	return (
		<div {...useBlockProps()}>
			<CsvSource onChange={(url) => setAttributes({ url })} />
		</div>
	);
}
