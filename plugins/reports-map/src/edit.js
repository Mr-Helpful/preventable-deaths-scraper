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
import { useState, useMemo } from "@wordpress/element";

/**
 * A text input that validates the input as a url to a CSV file
 *
 * @param {any} param0 The parameters for the CSVInput component
 * @param {(url: string) => void} param0.onChange A callback that is called when the input is changed to a valid CSV url
 * @returns {WPElement}
 */
function CSVUrlSource({ onChange }) {
	const [valid, setValid] = useState(false);

	return (
		<TextControl
			type="url"
			className={valid ? "csv-input" : "csv-input invalid-input"}
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
}

function read_to_url(file) {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result);
		reader.readAsDataURL(file);
	});
}

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {WPElement} Element to render.
 */
export default function Edit({ attributes, setAttributes }) {
	const file_input = (
		<FormFileUpload
			accept="text/csv"
			onChange={async (ev) => {
				console.log(ev.target.files[0]);
				const url = await read_to_url(ev.target.files[0]);
				console.log(url);
			}}
		>
			{__("Upload .csv File", "reports-map")}
		</FormFileUpload>
	);

	const url_input = <CSVInput onChange={(url) => setAttributes({ url })} />;

	return (
		<div {...useBlockProps()}>
			<TabPanel
				tabs={[
					{
						name: "file",
						title: __("File Upload", "reports-map"),
						content: file_input,
					},
					{
						name: "url",
						title: __("External URL", "reports-map"),
						content: url_input,
					},
				]}
				children={(tab) => tab.content}
			/>
		</div>
	);
}
