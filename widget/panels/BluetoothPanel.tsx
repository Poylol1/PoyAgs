import { execAsync, bind } from "astal"
import { Gdk, Astal, App, Gtk } from "astal/gtk3";
import Bluetooth from "gi://AstalBluetooth"
import { createVisibility, toggleVisibility } from "../../Utils/togglePanels";
import { Variable } from "astal"
export function BluetoothPanel(gdkmonitor: Gdk.Monitor): JSX.Element {
	const bluetooth = Bluetooth.get_default();

	const connected = bind(bluetooth, "devices")
		.as(ds => ds.filter(d => d.connected));
	const notconnected = bind(bluetooth, "devices")
		.as(ds => ds.filter(d => !d.connected));

	return <window
		name="Bluetooth-Panel"
		className="B-Panel-Window"
		exclusivity={Astal.Exclusivity.NORMAL}
		anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
		application={App}
		visible={createVisibility('bluetooth')}>
		<box>

			<box hexpand halign={Gtk.Align.END}>

				<button onClick={() => {
					execAsync(
						`bash -c 'hyprctl dispatch togglespecialworkspace bluetooth;
         pgrep -f blueman-manager
         > /dev/null && killall blueman-manager || blueman-manager'`,
					).catch(e => { console.error(e) })
				}}>
					<icon icon={"network-bluetooth"} />
				</button>

				<button onClick={() => { toggleVisibility("bluetooth") }}>
					<label label={"X"} />
				</button>

			</box>

			<box className={"Devices-Box"}>

				<box className={"Connected-devices"} vertical>
					<label label={"Connected"} />

				</box>

				<box className={"Non-connected-devices"} vertical>
					<label label={"Not Connected"} />
				</box>

			</box>
		</box>
	</window>
}
function BluetoothButton(device: Bluetooth.Device): JSX.Element {
	return <button
		onClick={() => {
			//TODO make the error into a agsNotification
			device.connect_device().catch(e => console.error(e))
		}}>
		<box>
			<icon icon={bind(device, "icon")} />
			<label hexpand label={bind(device, "name")} />
			{/*
				TODO implement battery once the binding is available
			<icon icon={bind(device,"battery-percentage").as(p => `battery-level-${Math.floor(p/10)*10}-symbolic`)}/>*/}
		</box>
	</button>
}










