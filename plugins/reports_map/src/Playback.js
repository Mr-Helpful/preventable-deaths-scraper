import { useState } from "@wordpress/element";

export const Playback = ({ min, max, setValue }) => {
	const [playing, setPlaying] = useState(false);
	return (
		<span
			width={50}
			height={50}
			className="dashicons dashicons-controls-play"
		></span>
	);
};
