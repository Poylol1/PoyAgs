import { Variable, bind } from "astal";
let NotificationQueue: Variable<JSX.Element[]> = Variable([]);
export function addNotificationToStack(notification: JSX.Element) {
	let cop = NotificationQueue.get();
	cop.unshift(notification);
	NotificationQueue.set(cop);
}
/** notification is either the object that will be erased or the index*/
export function deleteNotification(notification: JSX.Element | number) { }
export default function RemainingNotifications() {
	return <box>
		{bind(NotificationQueue).as(notis => notis)}
	</box>
}
