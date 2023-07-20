import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import ReactDOM from "react-dom";
import { SaveBlock } from "./save";

window.addEventListener("load", () => {
	console.log("hydrating");

	const blocks = document.querySelectorAll(".report-heatmap-block");
	if (blocks.length === 0) return;

	for (const block of blocks) {
		const properties = JSON.parse(block.getAttribute("data-props"));
		console.log(properties);
		const saveblock = <SaveBlock {...properties} />;
		hydrateRoot(block, saveblock);
	}
});
