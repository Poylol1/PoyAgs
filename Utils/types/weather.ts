import GLib from "gi://GLib";
import { exec } from "astal";
const { getenv } = GLib;

//import { register } from "../../../../../../usr/share/astal/gjs"
interface weatherMain {
	id: string
	main: string
	description: string
	icon: string
	icon_path: string
}
interface Temperature {
	Celsius: boolean
	temp: number
	feels_like: number
	temp_min: number
	temp_max: number
}
/** Everything in unix timestamp format*/
interface Time {
	timeForecasted: string
	sunrise: string
	sunset: string
	timezone: string
}
interface OtherInfo {
	pressure: number
	humidity: number
	sea_level: number
	ground_level: number
	visibility: number
	windspeed: number
	windDegrees: number
	clouds: number
}
interface Location {
	country: string
	name: string
}
//@register({GTypeName: "WeatherProperties"})
export default interface WeatherProperties {
	// Main string I guess
	main: weatherMain
	temp: Temperature
	time: Time
	extra: OtherInfo
	place: Location
}
/**
 * Transforms the recieved JSON to a type Weather.
 * It contains everything in the response but it is easier to parse
 * */
export function responseToWeather(obj: { [key: string]: any }): WeatherProperties {
	const CONFIG = getenv("XDG_CONFIG_HOME");
	const CACHE = getenv("HOME") + "/.cache/astal/weather/";

	const icon: string = String(obj?.["weather"]?.[0]?.["icon"] || -1);
	let icon_path: string;
	if (icon !== "-1") {
		exec(["bash", "-c",
			`if [ ! -f "${CACHE}${icon}" ]; then curl "https://openweathermap.org/img/wn/${icon}@2x.png" > ${CACHE}${icon}; fi`]);
		icon_path = `${CACHE}${icon}`
	} else {
		icon_path = `${CONFIG}/ags/special-icons/fallback-weather-icon.png`
	}
	const main: weatherMain =
	{
		// TODO make this available and not limited with the index
		id: String(obj?.["weather"]?.[0]?.["id"] || -1),
		main: String(obj?.["weather"]?.[0]?.["main"] || -1),
		description: String(obj?.["weather"]?.[0]?.["description"] || -1),
		icon: String(obj?.["weather"]?.[0]?.["icon"] || -1),
		icon_path: icon_path
	}
	const temp: Temperature = {
		// TODO make this be able to be set on Farenheit or Kelvin
		Celsius: true,
		feels_like: Number(obj?.["main"]?.["feels_like"] || -1),
		temp_max: Number(obj?.["main"]?.["temp_max"] || -1),
		temp: Number(obj?.["main"]?.["temp"] || -1),
		temp_min: Number(obj?.["main"]?.["temp_min"] || -1),
	}
	const extra: OtherInfo = {
		pressure: Number(obj?.["main"]?.["pressure"] || -1),
		humidity: Number(obj?.["main"]?.["humidity"] || -1),
		sea_level: Number(obj?.["main"]?.["sea_level"] || -1),
		ground_level: Number(obj?.["main"]?.["grnd_level"] || -1),
		visibility: Number(obj?.["visibility"] || -1),
		windspeed: Number(obj?.["wind"]?.["speed"] || -1),
		windDegrees: Number(obj?.["wind"]?.["deg"] || -1),
		clouds: Number(obj?.["clouds"]?.["all"] || -1)
	}
	const place: Location = {
		country: String(obj?.["sys"]?.["country"] || -1),
		name: String(obj?.["name"] || -1)
	}
	const time: Time = {
		timeForecasted: String(obj?.["dt"] || -1),
		timezone: String(obj?.["timezone"] || -1),
		sunrise: String(obj?.["sys"]?.["sunrise"] || -1),
		sunset: String(obj?.["sys"]?.["sunset"] || -1)
	}

	return { main: main, temp: temp, extra: extra, place: place, time: time }
}
