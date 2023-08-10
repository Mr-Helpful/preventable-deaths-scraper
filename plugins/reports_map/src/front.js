import React from "react";
import { createRoot } from "react-dom/client";
import { SaveBlock } from "./save";

window.addEventListener("load", () => {
	const blocks = document.querySelectorAll(".report-heatmap-block");
	if (blocks.length === 0) return;

	for (const block of blocks) {
		const properties = JSON.parse(block.getAttribute("data-props"));
		createRoot(block).render(
			<div className="report-heatmap-block" data-props={properties}>
				<SaveBlock {...properties} />
			</div>
		);
	}
});
