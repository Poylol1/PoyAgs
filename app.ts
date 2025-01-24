import { App } from "astal/gtk3"
import style from "./style.scss"
import Bar from "./widget/Bar"
import NotificationPopups from "./widget/panels/NotificationPopups";
import General from "./widget/panels/General"

App.start({
	css: style,
	main() {
		[...App.get_monitors().map(Bar),
		...App.get_monitors().map(NotificationPopups),
		...App.get_monitors().map(General),
		]
	},
})
