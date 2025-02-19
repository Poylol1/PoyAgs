import Tray from "gi://AstalTray";
import { Astal, App, Gtk, Gdk } from "astal/gtk3";
import { bind, Variable, GLib, execAsync, exec, Binding } from "astal";
import PowerProfiles from "gi://AstalPowerProfiles";
import Brightness from "../../Utils/backlightService";
import { getLimitingWord } from "../../Utils/generalUtils";
import IdleInhibitor from "../../Utils/idleInhibitor";
import Metadata from "../../Utils/UsageService";
import Music from "gi://AstalMpris";
import { createVisibility, toggleVisibility } from "../../Utils/togglePanels"
import { forceChar } from "../../Utils/generalUtils";
import RemainingNotifications from "./RemainingNotifications";
//import { notifyAGS } from "./agsNotifications";
const homePath = exec("bash -c 'echo $XDG_CONFIG_HOME'") + "/ags/";
const me = exec("whoami");

/** returns sec => min:sec*/
function lengthStr(length: number) {
	const min = Math.floor(length / 60)
	const sec = Math.floor(length % 60)
	const sec0 = sec < 10 ? "0" : ""
	return `${min}:${sec0}${sec}`
}

function SysTray(): JSX.Element {
	const items = bind(Tray.get_default(), "items").as(items => items
		.map(item => { // TODO Make Both Clicks available through thingy or smth
			const menu = Object.hasOwnProperty.call(item, "create_menu") ? item.create_menu() : null;
			return (
				<button
					className="systemtray_item"
					tooltipText={bind(item, 'tooltipMarkup')}
					valign={Gtk.Align.CENTER}
					onClick={(self: JSX.Element, e: Astal.ClickEvent) => {
						const click = e.button

						if (click === Astal.MouseButton.PRIMARY) {
							//setSystemTrayState(false)
							item.activate(0, 0)
							return
						}
						if (menu !== null) {
							menu?.popup_at_widget(
								self,
								Gdk.Gravity.SOUTH,
								Gdk.Gravity.NORTH,
								null,
							)
						}
						else {
							item.activate(0, 0);
						}
					}}
				>
					<icon icon={bind(item, 'iconName')} />
				</button>
			)
		}
		))
	return <box hexpand>

		<button onClick={() => {
			execAsync("bash -c 'rofi -show drun'")
			toggleVisibility("general")
		}} >
			<label label={"APPS"} />
		</button>

		<box className={"G-System-Tray"} halign={Gtk.Align.END} hexpand>
			{items}
		</box>

	</box>
}
function MprisPlayer() {
	const { START, CENTER, END } = Gtk.Align;
	const mpris = Music.get_default();
	const maxLen = 25;
	const playerIndex = Variable(0);
	const playerList = Variable.derive([playerIndex, bind(mpris, "players")], (v1, v2) => { return { list: v2, index: v1 } });
	//const track = Variable.derive([bind(mpris, 'players'), playerIndex], (a, i) => a[i])
	//const numberOfTracks = Variable.derive([mpris, playerIndex], (v1, v2) => `${v2 + 1}/${v1.length}`)
	// Colors = '#FFFFFF' : '#BDBDBD'
	return <box className={"G-Mpris-Box-Wrapper"} >
		{
			bind(playerList).as(({ index, list }) => {
				//console.log(list.length)
				if (list.length < 1) return <label label={"Nothing Playing :("} vexpand hexpand valign={CENTER} halign={CENTER} />
				const track = list[index];
				return <box vertical className={"G-Mpris-Box"} hexpand>
					<label label={"Player"} />
					<box className={"G-M-Player-Changer"} hexpand >
						<label label={`${index + 1} / ${list.length}`} className={"G-M-Player-Changer"} halign={START} hexpand />

						<box halign={END}>
							<button
								onClick={() => {
									if (playerIndex.get() > 0) {
										playerIndex.set(playerIndex.get() - 1)
										return;
									}
									playerIndex.set(list.length - 1);
								}}
								halign={END}>
								<icon icon={"go-previous"}
									css={bind(playerIndex).as(i => i > 0 ? `color:#FFFFFF` : "color:#BDBDBD")} />
							</button>
							<button onClick={() => {
								if (playerIndex.get() < list.length - 1) {
									playerIndex.set(playerIndex.get() + 1)
									return
								}
								playerIndex.set(0)

							}} halign={END}>
								<icon icon={"go-next"}
									css={bind(playerIndex).as(i => i < list.length - 1 ? `color:#FFFFFF` : "color:#BDBDBD")} />
							</button>
						</box>
					</box>

					<box vertical className={"G-M-Total-Info"}>
						<box className={"G-M-Title-n-Icon"} hexpand >
							<label halign={START} hexpand className={"G-M-Title"} label={bind(track, "title").as(t => getLimitingWord(t, maxLen, [" ", "-", ",", "/"]))} truncate />
							<icon halign={END} className={"G-M-Icon"} icon={bind(track, "entry").as(e => Astal.Icon.lookup_icon(e) ? e : "audio-x-generic-symbolic")} />
						</box>
						<label halign={Gtk.Align.CENTER} className={"G-M-Author"} hexpand={false}
							label={bind(track, "albumArtist").as(a => a || "Author Not Available")} />
					</box>

					<box className={"G-M-Cover-Art"} css={bind(track, "coverArt").as(u => {
						console.log(u);
						return u ? `background-image: url('${u}')`
							: `background-image: url('${homePath}special-icons/image-not-found.png')`
					})} />

					<box className={"G-M-Main-Box"} >

						<box halign={Gtk.Align.CENTER} className={"G-M-Button-Box"} vexpand={false} valign={Gtk.Align.CENTER}>
							<button className={"G-M-Previous-Button"}
								onClick={() => { track.canGoPrevious && track.previous() }}>
								<icon className={"G-M-Back-Icon"} icon={"media-skip-backward-symbolic"}
									css={bind(track, "canGoPrevious").as(c => c ? `color:#FFFFFF` : "color:#BDBDBD")} />
							</button>

							<button className={"G-M-Pause-Button"} onClick={() => { track.canPlay && track.play_pause() }}>
								<icon className={"G-M-Pause-Icon"}
									icon={bind(track, "playbackStatus")
										.as(p => p == Music.PlaybackStatus.PLAYING ? "media-playback-pause-symbolic" : "media-playback-start-symbolic")}
									css={bind(track, "canPlay").as(c => c ? `color:#FFFFFF` : "color:#BDBDBD")}
								/>
							</button>
							<button className={"G-M-Forward-Button"}
								onClick={() => { track.canGoNext && track.next() }}>
								<icon className={"G-M-Forward-Icon"} icon={"media-skip-forward-symbolic"}
									css={bind(track, "canGoNext").as(c => c ? `color:#FFFFFF` : "color:#BDBDBD")} />
							</button>

						</box>
					</box>

					<box>
						<label className={"G-M-Time-Label"}
							label={bind(track, "position").as(p => {
								const a = track.length > 0 ? lengthStr(track.length) : "0:00"
								const b = track.length > 0 && p > 0 ? lengthStr(p) : "0:00"
								return `${b} / ${a}`
							})} />
						<slider onDragged={({ value }) => { if (track.length > 0) { track.position = value * track.length } }}
							className={"G-M-Time-Slider"}
							value={bind(track, "position").as(p => track.length > 0 ? p / track.length : 0)}
							css={bind(track, "length").as(l => l > 0 ? `color:#FFFFFF` : "color:#BDBDBD")}
							hexpand />
					</box>
				</box>

			})}
	</box >
}

function daysInMonth(month: number, year: number): number {
	return new Date(year, month + 1, 0).getDate();
}
function weekDayInMonth(month: number, year: number): number {
	return new Date(year, month).getDay();
}
function fillMonth(month: number, year: number): JSX.Element[] {
	const current = daysInMonth(month, year);
	const past = daysInMonth(month, year);
	const day = weekDayInMonth(month, year);
	let weekAr: [number, boolean][][] = [[]];
	let turner: JSX.Element[] = [];
	for (let i = 0; i < day; i++) {
		weekAr[0].push([past - (day - i), false]);
	}
	let dayNo = 1;
	let tru = true;
	for (let j = 0; j < 6; j++) {
		if (!weekAr[j]) weekAr.push([])
		while (weekAr[j].length < 7) {
			if (dayNo > current) {
				dayNo = 1;
				tru = false;
			}
			weekAr[j].push([dayNo, tru]);
			dayNo++
		}
	}
	for (let week of weekAr) {
		turner.push(fillWeek(week))
	}
	return turner;
}
function fillWeek(weekDays: [number, boolean][]): JSX.Element {
	return <box className={"G-C-Week"}>
		{weekDays.map(([i, c]) =>
			<button className={c ? "inMonth" : "notInMonth"}>
				<label label={i.toString()} />
			</button>)}
	</box>
}

function CurrentDate({ format = '%A %d %B, %Y At %H:%M:%S %Z' }): JSX.Element {
	const time = Variable<string>("").poll(1000, () =>
		GLib.DateTime.new_now_local().format(format)!)
	return <box vertical >
		<label label={`Hi ${me}, Today is`} />
		<label label={time()} onDestroy={() => time.drop()} />
	</box>
}
function Calendar() {
	const days = [
		"Sun",
		"Mon",
		"Tue",
		"Wed",
		"Thr",
		"Fri",
		"Sat"
	];

	//const t = GLib.DateTime.new_now_local().format(format)!;

	const today = [(new Date()).getDate(), (new Date()).getMonth() + 1, (new Date()).getFullYear()];

	const curMonth = Variable(today[1] - 1);
	const curYear = Variable(today[2]);
	const dateUnion = Variable.derive([curMonth, curYear], (v1, v2) => [v1, v2])
	// Nothing more permanent than a temporary solution
	// Should use a 
	// locale = exec(locale | grep Lang).split(".")[0]
	// Date.getFromLocale(locale, {Month: full})
	// Or somthing like that but it is annoying to fully implementA
	const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	//const monthAndyear = [Variable(today[1]), Variable(today[2])];

	return <box className="G-Calendar-Wrapper" vertical hexpand>


		<label label={"Calendar"} />
		<box className={"G-C-Modification-Box"} hexpand halign={Gtk.Align.CENTER}>
			<button halign={Gtk.Align.CENTER}
				onClick={() => {
					curYear.set(today[2]);
					curMonth.set(today[1] - 1)
				}}>
				<icon icon={"edit-reset"} />
			</button>
			<box halign={Gtk.Align.START}>
				<button
					onClick={() => {
						let prevMonth = curMonth.get() - 1;
						if (prevMonth <= 0) prevMonth = 11
						curMonth.set(prevMonth)
					}}>
					<icon icon={"go-previous"} />
				</button>
				<label className={"G-C-Months-Label"}
					label={bind(curMonth).as(i => months[i])} />
				<button
					onClick={() => { curMonth.set((curMonth.get() + 1) % 12) }}>
					<icon icon={"go-next"} />
				</button>
			</box>

			<box halign={Gtk.Align.END}>
				<button
					onClick={() => {
						curYear.set(curYear.get() - 1)
					}}>
					<icon icon={"go-previous"} />
				</button>
				<label className={"G-C-Year-Label"}
					label={bind(curYear).as(String)} />
				<button
					onClick={() => {
						curYear.set(curYear.get() + 1)
					}}>
					<icon icon={"go-next"} />
				</button>

			</box>
		</box>

		<box vertical halign={Gtk.Align.CENTER} className={"G-C-body"}>
			<box hexpand className={"G-C-Weekdays"}>
				{days.map(j => <label label={j} className="Day-Name" />)}
			</box>
			<box hexpand={false} vertical className={"G-C-Month"}>
				{bind(dateUnion).as(v => fillMonth(v[0], v[1]))}
			</box>
		</box>
	</box>
}
function BatteryProfile() {
	const defaultProfiles = PowerProfiles.get_default();
	const list = defaultProfiles.get_profiles().map(p => p.profile);
	return <button
		className="power-Profiles"
		onClick={() => {
			const index = list.findIndex(i => defaultProfiles.get_active_profile() == i);
			defaultProfiles.set_active_profile(list[(index + 1) % (list.length)])
		}} >
		<icon icon={bind(defaultProfiles, "iconName")} />
	</button>
}
function Backlight() {
	const brightness = Brightness.get_default()
	const possibleIcons = ["󰌶 ", "󱩎 ", "󱩏 ", "󱩐 ", "󱩑 ", "󱩒 ", "󱩓 ", "󱩔 ", "󱩕 ", "󱩖 ", "󰛨 "];
	return <button className={"Backlight"}
		onClick={() => {/* Make it expand and become a slider*/ return }}>
		<box className={"Brightness-Box"}>
			<label label={bind(brightness, "screen").as(i => `${Math.round(i * 100)}%`)} />
			<label label={bind(brightness, "screen").as(i => possibleIcons[Math.round(i * 10)])}
				className={"Brightness-Icon"} />
		</box>
	</button>
}
function Inhibitor() {
	const inhibit = IdleInhibitor.get_default();
	return <button className={"Idle_Inhibitor"}
		onClick={() => { inhibit.toggleActive() }}
		onDestroy={() => { inhibit.drop() }}>
		<label label={bind(inhibit, "active").as(b => {
			return (b ? "󰒳 " : "󰒲 ")
		})} />
	</button>
}
function GeneralBar() {
	const metadata = Metadata.get_default();
	const diskPercent = Variable.derive([bind(metadata, "disk_used"), bind(metadata, "disk_total")], (v1, v2) => [v1, v2])
	const ramPercent = Variable.derive([bind(metadata, "ram_free"), bind(metadata, "ram_total")], (v1, v2) => [v2 - v1, v2])
	const tempPercent = Variable.derive([bind(metadata, "temperature_current"), bind(metadata, "temperature_urgent")], (t1, t2) => t1 / t2)
	return <box vertical>
		<box vertical>
			<box>
				<MetadataProgress
					icon={"cpu"}
					value={bind(metadata, "cpu_used").as(i => i / 100)}
					labelTop={bind(metadata, "cpu_used").as(i => `${forceChar(i, 2, 1)}%`)}
					labelBottom={bind(metadata, "cpu_total").as(i => `${i}%`)}
					tooltipText={bind(metadata, "cpu_used").as(i => `${i}% of CPU is being used`)}
				/>
				<MetadataProgress
					icon={"disk-quota"}
					value={bind(diskPercent).as(([v1, v2]) => v1 / v2)}
					labelTop={bind(diskPercent).as(([v1, _]) => `${Math.round(v1 * .0001) / 100}GB`)}
					labelBottom={bind(diskPercent).as(([_, v2]) => `${Math.round(v2 * .0001) / 100}GB`)}
					tooltipText={bind(diskPercent).as(([v1, v2]) => `${Math.round(v1 * .0001) / 100}GB used out of ${Math.round(v2 * .0001) / 100}GB available`)}
				/>
			</box>
			<box>
				<MetadataProgress
					icon={'dialog-memory'}
					value={bind(ramPercent).as(v => v[0] / v[1])}
					labelTop={bind(ramPercent).as(([v1, _]) => `${Math.round(v1 * 100) / 100}GB`)}
					labelBottom={bind(ramPercent).as(([_, v2]) => `${Math.round(v2 * 100) / 100}GB`)}
					tooltipText={bind(ramPercent).as(([v1, v2]) => `${Math.round(v1 * 100) / 100}GB of RAM used out of ${Math.round(v2 * 10000) / 100}GB`)}
				/>
				<MetadataProgress value={bind(tempPercent)}
					icon={'temperature-cold'}
					labelTop={bind(metadata, "temperature_current").as(t => `${t}℃ `)}
					labelBottom={bind(metadata, "temperature_urgent").as(t => `${t}℃ `)}
					tooltipText={bind(metadata, "temperature_current").as(t => `Current Temperature ${t}℃ `)}
				/>
			</box>
		</box>
	</box>
}

function screenWidget({ icon = "question", clickLeft = () => { }, clickRight = () => { }, className = "screenWidget" }): JSX.Element {

	return <box className={className}>
		<box>
			<button onClick={clickLeft}>
				<icon icon={icon} />
			</button>
		</box>
		<box>
			<button onClick={clickRight}>
				<icon icon={"go-next"} />
			</button>
		</box>
	</box>
}

//function MetadataProgress({value: number | Binding<number> = 1 / 4, icon: string | Binding<string> = "question", labelTop: string | Binding<string | undefined> = "", labelBottom: string | Binding<string> = "", tooltipText: string | Binding<string> = "", className: string = "metadataProgress"}): JSX.Element {
interface MetadataProgressType {
	value?: number | Binding<number | undefined> | undefined,
	icon?: string | Binding<string | undefined>,
	labelTop?: string | Binding<string | undefined> | undefined,
	labelBottom?: string | Binding<string | undefined> | undefined,
	tooltipText?: string | Binding<string | undefined> | undefined,
	className?: string | Binding<string | undefined>
}
function MetadataProgress({ value, icon = "question", labelTop, labelBottom, tooltipText, className = "metadata_progress" }: MetadataProgressType): JSX.Element {
	const { CENTER } = Gtk.Align;
	return <box tooltipText={tooltipText} className={className}>
		<circularprogress startAt={1 / 4} endAt={1 / 4} value={value} className={"progress"} halign={CENTER} valign={CENTER} rounded >
			<box vertical halign={CENTER} valign={CENTER} vexpand hexpand>
				<label label={labelTop} className={"top-progress"} />
				<box hexpand halign={CENTER}>
					<label label={"--"} />
					<icon icon={icon} />
					<label label={"--"} />
				</box>
				<label label={labelBottom} className={"bottom-progress"} />
			</box>
		</circularprogress>
	</box>
}

function Zenith(): JSX.Element {
	let buttons: { [action: string]: [string, string] } = {
		// Not adding screensave any time soon too complex for me right now
		//screensave: [], // This is the most complex part and needs a service on its own
		shutdown: ["shutdown now", "system-shutdown"],
		reboot: ["reboot", "system-reboot"],
		lock: ["hyprlock", "system-lock-screen-symbolic"],
		sleep: ["systemctl suspend", "system-suspend"],
		hibernate: ["systemctl hibernate", "system-suspend-hibernate"],
		kick: ["hyprctl dispatch exit", "system-log-out"],
	};
	let turner: JSX.Element[] = [];
	for (let act in buttons) {
		turner.push(
			<button className={act}
				onClick={() => { execAsync(buttons[act][0]) }}
				tooltip_text={act}>
				<icon icon={buttons[act][1]} />
			</button>)
	}
	return <box className={"Zenith"}>
		{turner}
	</box>
}
export default function GeneralPanel(gdkmonitor: Gdk.Monitor): JSX.Element {
	return <window
		name="General-Panel"
		className="G-Panel-Window"
		gdkmonitor={gdkmonitor}
		exclusivity={Astal.Exclusivity.NORMAL}
		application={App}
		anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT}
		gravity={Gdk.Gravity.SOUTH}
		visible={createVisibility('general')}
	// Ill do something or smth
	// onKeyPressEvent={function(self, event: Gdk.Event) {
	// 	if (event.get_keyval()[1] === Gdk.KEY_Escape)
	// 		self.hide()
	// }}
	>
		<box>
			<box
				orientation={Gtk.Orientation.VERTICAL}
				className={"G-Main-Box"}>
				<SysTray />
				<CurrentDate />
				<box>
					<box vertical>
						<Calendar />
						<GeneralBar />
					</box>
					<box vertical>
						<MprisPlayer />
						<box className={"Screen_Box"}>
							<Inhibitor />
							<BatteryProfile />
							<Backlight />
						</box>
					</box>
				</box>
				<Zenith />
			</box>
			<RemainingNotifications />
		</box>
	</window >
}
