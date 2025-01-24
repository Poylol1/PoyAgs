import GObject, { property, register } from "astal/gobject";
import { execAsync, Variable } from "astal"

@register({ GTypeName: "IdleInhibitor" })
export default class IdleInhibitor extends GObject.Object {
	static instance: IdleInhibitor;
	static get_default() {
		if (!this.instance) {
			this.instance = new IdleInhibitor();
		}
		return this.instance
	}
	#active = Variable(false)

	@property(Boolean)
	get active() {
		//console.log(this.#active.get())
		return this.#active.get()
	}

	toggleActive() {
		this.notify('active')
		execAsync("bash -c 'matcha -t'").catch(e => console.error(e));
	}

	stopWatching() {
		this.#active.stopWatch();
	}
	drop() {
		this.#active.drop();
	}
	constructor() {
		super();
		this.#active.watch(["bash", "-c", "matcha -g"], (out) => {
			this.notify("active");
			return (out == "Starting Matcha")
		});
		//this.#active.startWatch()
		//console.log(this.#active.isWatching())
	}
}
