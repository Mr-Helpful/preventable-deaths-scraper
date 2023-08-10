/** A two thumb slider adapted from [Ana Tudor's work](https://css-tricks.com/multi-thumb-sliders-particular-two-thumb-case/).<br/>
 *
 * We put particular focus on accessibility and performance.
 */
export function RangeInput() {
	return (
		<div
			multi-range
			role="group"
			style="--h: 2em; --a: -30; --b: 20; --min: -50; --max: 50"
		>
			<input id="a" type="range" min="-50" value="-30" max="50" />
			<input id="b" type="range" min="-50" value="20" max="50" />
		</div>
	);
}

/*
addEventListener('input', e => {
  let _t = e.target;
  _t.parentNode.style.setProperty(`--${_t.id}`, +_t.value)
}, false);
*/
