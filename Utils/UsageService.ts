import GObject, { register, property } from "astal/gobject";
import { exec, Variable } from "astal";
//
// TODO poll this every second? or 5 seconds. IDK maybe use a watch
// although it seems like too many watch... Too many polls too...
// IDK something along those lines
//  Change this number to change rate
const refreshTimer = 5000;

const CPU = {
	total: 100,
	used: execToNum(
		` top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk '{print 100 - $1}'`,
	)
};
const RAM = {
	total: execToNum(
		`cat /proc/meminfo | grep MemTotal | awk '{print $2/1000000}'`),
	free: execToNum("cat /proc/meminfo | grep MemFree | awk '{print $2/1000000}'"),
};
const TEMP = {
	urgent: 90,
	current: execToNum("acpi -t | awk '{print $4}'"),
};
// TODO expand this out of root disk
const DISK = {
	total: execToNum("df | grep /$ | awk '{print $2}'"),
	used: execToNum("df | grep /$ | awk '{print $3}'"),
};
function execToNum(command: string): number {
	return Number(exec(["bash", "-c", command]))
}
@register({ GTypeName: "Metadata" })
export default class Metadata extends GObject.Object {
	static instance: Metadata
	static get_default() {
		if (!this.instance) this.instance = new Metadata();
		return this.instance;
	}

	#temperature_urgent = TEMP.urgent;
	#cpu_total = CPU.total;

	#ram_free = Variable(RAM.free);
	#disk_used = Variable(DISK.used);
	#temperature_current = Variable(TEMP.current);
	#cpu_used = Variable(CPU.used);

	/** returns in Percent*/
	@property(Number)
	get cpu_used() {
		return this.#cpu_used.get()
	}

	/** returns in Celcius*/
	@property(Number)
	get temperature_current() {
		return this.#temperature_current.get()
	}

	/** returns in Kb*/
	@property(Number)
	get disk_used() {
		return this.#disk_used.get()
	}

	/** returns in Gb*/
	@property(Number)
	get ram_free() {
		return this.#ram_free.get()
	}

	/** returns in Gb*/
	@property(Number)
	get ram_total() {
		return execToNum(`cat /proc/meminfo | grep MemTotal | awk '{print $2/1000000}'`);
	}

	/** returns in Kb*/
	@property(Number)
	get disk_total() {
		return execToNum("df | grep /$ | awk '{print $2}'");
	}

	/** returns in Celcius*/
	@property(Number)
	get temperature_urgent() {
		return this.#temperature_urgent;
	}

	/** returns in Percent*/
	@property(Number)
	get cpu_total() {
		return this.#cpu_total;
	}

	set temperature_urgent(MAX_TEMP: number) {
		this.#temperature_urgent = MAX_TEMP;
		this.notify("temperature_urgent")
	}
	set cpu_total(MAX_CPU: number) {
		this.#cpu_total = MAX_CPU;
		this.notify("cpu_total");
	}

	toggle_polling() {
		if (this.#cpu_used.isPolling()) {
			this.#cpu_used.stopPoll()
			this.#ram_free.stopPoll()
			this.#disk_used.stopPoll()
			this.#temperature_current.stopPoll()
		}
		else {
			this.#cpu_used.startPoll()
			this.#ram_free.startPoll()
			this.#disk_used.startPoll()
			this.#temperature_current.startPoll()
		}
	}
	constructor() {
		super()
		const commands = {
			CPU_used: ` top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk '{print 100 - $1}'`,
			RAM_free: "cat /proc/meminfo | grep MemFree | awk '{print $2/1000000}'",
			DISK_current: "df | grep /$ | awk '{print $3}'",
			TEMP_current: "acpi -t | awk '{print $4}'",

		}

		this.#ram_free.poll(refreshTimer, ["bash", "-c", commands.RAM_free], (out) => {
			this.notify("ram_free");
			return Number(out)
		})
		this.#disk_used.poll(refreshTimer, ["bash", "-c", commands.DISK_current], (out) => {
			this.notify("disk_used");
			return Number(out)
		})
		this.#temperature_current.poll(refreshTimer, ["bash", "-c", commands.TEMP_current], (out) => {
			this.notify("temperature_current");
			return Number(out)
		})
		this.#cpu_used.poll(refreshTimer, ["bash", "-c", commands.CPU_used], (out) => {
			this.notify("cpu_used");
			return Number(out)
		})

		this.notify("ram_total");
		this.notify("disk_total");
		this.notify("temperature_urgent");
		this.notify("cpu_total");
	}
}
