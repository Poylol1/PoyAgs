import { Astal, Gtk, Gdk } from "astal/gtk3";
import { Variable, bind, timeout } from "astal";

const builtinTypes: { [key: string]: string } = {
	"brightness": "",
	"Inhibitor": "",
	"PowerProfile": "",
}
const timeoutWait = 200;

const icon = Variable("");
const label = Variable("");
const inNotification = Variable(false);
let hereOnce = false;
export function notifyAGS(message: string, type: string) {
	console.log(message)
	// icon.set(builtinTypes[type]);
	// label.set(message);
	// inNotification.set(true);
	// if (hereOnce) return;
	// hereOnce = true
	// timeout(timeoutWait, () => {
	// 	inNotification.set(false)
	// 	hereOnce = false;
	// });

}
// -------------------
//            |-----| 
//          notification
//      [icon thingy]
//      like type
export default function AGSNotifications(gdkmonitor: Gdk.Monitor) {
	const { TOP, RIGHT } = Astal.WindowAnchor;
	return <window className="Astal-Notification-Window"
		gdkmonitor={gdkmonitor}
		exclusivity={Astal.Exclusivity.EXCLUSIVE}
		visible={bind(inNotification)}
		anchor={TOP | RIGHT}>

		<box className={bind(inNotification)
			.as(b => b ? "Astal-Notification-Box-in"
				: "Astal-Notification-Box-not-in")}>

			<icon icon={bind(icon).as(i => i == '' ? "question" : i)}
				className="Astal-Notification-Icon" />

			<label label={bind(label).as(String)}
				className="Astal-Notification-Label" />

		</box>
	</window>
}
