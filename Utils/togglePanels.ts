import { bind, Binding, Variable } from "astal"

// This will work to toogle panels
const panels: { [key: string]: Variable<boolean> } = {}
export function createVisibility(name: string): Binding<boolean> {
	panels[name] = Variable(false);
	return bind(panels[name]);
}
export function printKeys() {
	for (let i in panels) { console.log(i) }
}
export function setVisibility(panel: string, state: boolean) {
	panels[panel].set(state);
}
export function toggleVisibility(panel: string): void {
	try {
		panels[panel].set(!panels[panel].get())
	}
	catch (e) {
		console.error(e)
		printKeys()
	}
}
