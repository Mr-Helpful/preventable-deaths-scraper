/**
 * @typedef {Object} ReportScaleProps
 * @property {number} max the total number of reports
 * @property {{index: number, rgb: [number, number, number]}[]} scale a color scale
 */

/**
 * Generates a scale bar for the report heatmap, with a gradient and tick marks.
 *
 * The bar will be divided into major ticks up to the order of magnitude of the
 * total number of reports, and minor ticks between each major tick. The major
 * ticks will be labelled with the number of reports that they represent.
 *
 * @param {ReportScaleProps} param0 the parameters for the ReportScale component
 * @return {WPElement}
 */
const ReportScale = ({ max, scale }) => {
	if (max === 0) max = 1;
	const exp_total = Math.floor(Math.log10(max));
	const major_tick = Math.pow(10, exp_total);
	const minor_tick = major_tick / 10;

	const large_ticks = Array.from(
		{ length: Math.ceil(max / major_tick) },
		(_, i) => i * major_tick
	);
	const major_ticks = [...large_ticks, max];
	const minor_ticks = Array.from(
		{ length: Math.ceil(max / minor_tick) },
		(_, i) => i * minor_tick
	);

	return (
		<>
			<defs>
				<linearGradient
					id="Report_Heatmap_Scale_Gradient"
					x1="0"
					y1="1"
					x2="0"
					y2="0"
				>
					{scale.map(({ index, rgb }) => (
						<stop
							key={index}
							offset={`${index * 100}%`}
							stopColor={`rgb(${rgb.join(" ")})`}
						/>
					))}
				</linearGradient>
			</defs>
			<rect
				width="25"
				height="600"
				stroke="black"
				strokeWidth="0.75"
				fill="url(#Report_Heatmap_Scale_Gradient)"
			></rect>
			{major_ticks.map((tick) => {
				const y = 600 - (tick / max) * 600;
				return (
					<g key={y} transform={`translate(0 ${y})`}>
						<line
							x1={25}
							y1={0}
							x2={30}
							y2={0}
							stroke="black"
							strokeWidth="0.75"
						/>
						<text x="31" y="0.32em" fontSize="0.5em">
							{tick}
						</text>
					</g>
				);
			})}
			{minor_ticks.map((tick) => {
				const y = 600 - (tick / max) * 600;
				return (
					<g key={y} transform={`translate(0 ${y})`}>
						<title>{tick}</title>
						<line
							x1={25}
							y1={0}
							x2={28}
							y2={0}
							stroke="black"
							strokeWidth="0.5"
						/>
					</g>
				);
			})}
		</>
	);
};

export default ReportScale;
