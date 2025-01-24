import { toggleVisibility } from "../Utils/togglePanels"
import { App, Astal, Gtk, Gdk } from "astal/gtk3"
import { /* Binding, */ GLib, Variable, bind, timeout } from "astal"
import Battery from "gi://AstalBattery";
//import Mpris from "gi://AstalMpris"
import Hyprland from "gi://AstalHyprland";
import AstalApps from "gi://AstalApps";
//import Backlight from "../Utils/backlightService";
import Audio from "gi://AstalWp";
import { AdvancedFind } from "../Utils/generalUtils";
import Weather from "../Utils/weatherService";

import {
	exec,
	execAsync
} from "astal/process"; import PowerProfiles from "gi://AstalPowerProfiles";
import Tray from "gi://AstalTray";
import Bluetooth from "gi://AstalBluetooth";
import Internet from "gi://AstalNetwork";
//import { type Subscribable } from "astal/binding";

//
// The normal config directory of the system or smth
//Weather("Salinas")
const conf = exec("bash -c 'echo $XDG_CONFIG_HOME'") + "/ags/";


const specialWorkspaces: { [key: string]: string | null } = {
	"magic": "bibtex",
	"scratchpad": "folder-calculate-symbolic",
	"bluetooth": "network-bluetooth",
}
// TODO make this actually detect a change with a listener or something whatever idk
let inhibitorActive = Variable(false);

function Wireless() {
	const bluetooth = Bluetooth.get_default()
	return <button
		onClick={() => {
			toggleVisibility('bluetooth')
		}}
	>
		<box>
			<icon icon={"network-bluetooth"} />
			{bind(bluetooth, "devices")
				.as(devices => {
					return <box> {devices.map(d => bind(d, "connected").as(c => !c ? "" : <icon icon={bind(d, "icon")} />))} </box>
				})}
		</box>
	</button>
}
const tray = Tray.get_default();

function ArchIcon() {

	return <button
		className="arch-icon"
		onClick={() => {
			// TODO APPLauncher will use rofi temporally
			//execAsync(" bash -c 'rofi -show drun'");
			toggleVisibility('general');
		}}>
		<box>
			<icon icon={`${conf}special-icons/arch-linux.svg`} />
			<box className={"Tray-Box"}>
				{
					bind(tray, "items").as((items) => items.map(i => {
						if (i.icon_theme_path) App.add_icons(i.icon_theme_path)
						//const menu = i.create_menu()
						//return <button
						// 	tooltip_markup={bind(i, "tooltip_markup")}
						// 	onDestroy={() => menu?.destroy()} onClick={self => { menu?.popup_at_widget(self, Gdk.Gravity.SOUTH, Gdk.Gravity.NORTH, null)
						// 	}}>
						return <icon icon={bind(i, "iconName")} className="Tray-Icon" />
						// </button>
					}))
				}
			</box>
		</box>
	</button>
}

function FocusedClient() {
	//TODO make this update in live time
	const app = AstalApps.Apps.new().list;
	const hypr = Hyprland.get_default();
	const client = bind(hypr, "focused_client");
	//let inTimeout: boolean = false;
	let iconName = "monitor-symbolic";
	return <button
		onClick={() => { func() }}
		className="FocusedClient"
	>
		<icon
			icon_size={22}
			icon={client.as((c) => {
				iconName = AdvancedFind(app, c, "get_name", ["get_initial_title", "get_initial_class", "get_title", "get_class"], "get_icon_name")

				return iconName == "N/A" ? "monitor-symbolic" : iconName;
			})}
		/>
	</button>
}

//FIX IDK why this does not work but it should. Looking towards the fix
function Workspaces() {
	const hypr = Hyprland.get_default()
	return <box className={"Workspaces"} >
		{
			bind(hypr, "workspaces").as(i =>
				i.sort((j, k) => j.id - k.id)
					.map(ws => {
						//TODO Make the workspaces number better and modify some stuff
						return (
							<button
								className={"workspace"}
								css={bind(hypr, "focusedWorkspace").as(fc => ws === fc ? "min-width: 50px; background:#3f3f5b;" : "")}
								onClick={() => { ws.focus() }}>
								{ws.id <= 0 ? <icon icon={specialWorkspaces[ws.get_name().substring(8).trim()] ?? "question"} /> :
									<label label={bind(hypr, "focusedWorkspace").as(fc => ws === fc ? ws.id.toString() : "")} />}
							</button >)
					})
			)
		}
	</box >
}

function BatteryPercent() {
	const bat = Battery.get_default();
	return <button className={"Battery-Left"}
		onClick={() => func()}
	>
		<box className={"Battery-Box"}>
			<label label={bind(bat, "percentage").as(p => `${Math.round(p * 100)}%`)} />
			<icon icon={bind(bat, "batteryIconName")} />
		</box>
	</button>
}

//TODO make it able to access seconds when needed Add Calendar or smth
function Climate() {

	const weather = Weather.get_default(null, true)
	return <button>
		<box>
			<box className="climateIcon" css={bind(weather, "properties").as(p => {
				//console.log(s)
				return `background-image: url('${p.main.icon_path}')`
			})} />
			<label label={bind(weather, "properties").as(v => `${Math.round(v.temp.temp)}°C`)} />
		</box>
	</button>

}
function Clock({ format = '%H:%M %e %b,%y' }) {
	const time = Variable<string>("").poll(1000, () =>
		GLib.DateTime.new_now_local().format(format)!)
	return <button>
		<label
			className={"Clock"}
			onDestroy={() => time.drop()}
			label={time()} />
	</button>
}
function Volume() {
	const audio = Audio.get_default()?.audio.defaultSpeaker!
	return <button
		className={"AudioButton"}
		onClick={() => func()}
	>
		<box
			className={"AudioBox"}>
			<label label={bind(audio, "volume").as(i => `${Math.round(i * 100)}%`)} />
			<icon icon={bind(audio, "volumeIcon")} />
		</box>
	</button>
}

function Wifi(): JSX.Element {
	const connection = Internet.get_default().get_wifi()!;
	// if (connection == null) {
	// 	console.error("IDK")
	// 	return <label label="IDK" />;
	// }
	return <button
		onClick={() => { func() }}
	>
		<icon icon={bind(connection, "icon_name").as(String)} />
	</button>
}
export default function Bar(gdkmonitor: Gdk.Monitor) {
	const { TOP, LEFT, RIGHT } = Astal.WindowAnchor;
	return <window
		className="Bar"
		gdkmonitor={gdkmonitor}
		exclusivity={Astal.Exclusivity.EXCLUSIVE}
		anchor={TOP
			| LEFT
			| RIGHT}

		application={App}>
		<centerbox>
			<box hexpand halign={Gtk.Align.START}>
				<ArchIcon />
				<BatteryPercent />
				<Clock />
				<Climate />
			</box>
			<box>
				<Workspaces />
			</box >
			<box hexpand halign={Gtk.Align.END}>
				< Wifi />
				<Wireless />
				<Volume />
				<FocusedClient />
			</box>
		</centerbox>
	</window>
}
//TODO order of importance
// Wifi   -| Interchangeable
// Media  -|
// Status

//TODO functions for those who have func in their on clicked
function func() {
	return null;
}
