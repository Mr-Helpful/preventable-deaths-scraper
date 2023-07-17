/**
 * Linearly interpolates across a color gradient
 * @param {number} f a number between 0 and 1
 * @param {{index: number, rgb: [number, number, number]}[]} scale a color scale
 * @returns {[number, number, number]}
 */
export function color_at(f, scale = color_scales.viridis) {
	if (f <= scale[0].index) return scale[0].rgb;
	if (f >= scale[scale.length - 1].index) return scale[scale.length - 1].rgb;

	let i = 1;
	for (; i < scale.length - 1; i++) {
		if (f < scale[i].index) break;
	}
	i--;

	const [fst, snd] = [scale[i], scale[i + 1]];
	const t = (f - fst.index) / (snd.index - fst.index);
	const [r0, g0, b0] = fst.rgb;
	const [r1, g1, b1] = snd.rgb;
	return [
		Math.floor(r0 * (1 - t) + r1 * t),
		Math.floor(g0 * (1 - t) + g1 * t),
		Math.floor(b0 * (1 - t) + b1 * t),
	];
}
