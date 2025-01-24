import GLib from "gi://GLib";
import GObject, { register, property } from "astal/gobject";
import WeatherProperties, { responseToWeather } from "./types/weather";
import { httpGet } from "./generalUtils";
import { exec } from "astal";
const { getenv } = GLib;
// The moment has come. I'll have to create a bash script to do the weather stuff
const APIKEY = getenv("WEATHER")
const CACHE = getenv("HOME") + "/.cache/astal/";
interface place {
	Name: string,
	lat: number | string,
	lon: number | string
}

@register({ GTypeName: "Weather" })
export default class Weather extends GObject.Object {
	static instance: Weather;
	static get_default(city?: string | null, find?: boolean | null) {
		if (!this.instance) this.instance = new Weather(city, find);
		return this.instance
	}
	toReadableTime: (unixTime: number | string) => string = (unixTime: number | string): string =>
		new Date(Number(unixTime) * 1000).toLocaleTimeString('en-US', { hour12: false });

	// Tokyo as default use set city to change it, you can also set it in
	// constructor
	#city: place = { Name: "Tokyo", lat: -1, lon: -1 };
	#nullObject: WeatherProperties = responseToWeather({ "-1": "-1" });
	// TODO Fill this up with fools and stuff
	#properties: WeatherProperties = this.#nullObject;
	async #placePos(city: string): Promise<place> {
		if (city == this.#city.Name && this.#city.lon !== -1) return this.#city;
		const placeUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&appid=${APIKEY}`;
		await httpGet(placeUrl)
			.then(r => {
				if (r.status != "200") {
					console.error(`bad request ${r.status} ${r.body}`);
					return
				}
				this.#city.lat = r.body[0]["lat"]
				this.#city.lon = r.body[0]['lon']
				this.#city.Name = r.body[0]['name']
			})
			.catch(e => { console.error(e) })
		return this.#city
	}
	async #getRequest(city: string): Promise<{ [key: string]: any }> {
		//fetch(url, { method: "GET" })
		const place = await this.#placePos(city)
		const climateUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${place.lat}&lon=${place.lon}&appid=${APIKEY}&units=metric`;
		return await httpGet(climateUrl)
			.then(({ body }) => body)
			.catch(e => { console.error(e) }) ?? this.#nullObject;
		// Get icons through https:openweathermap.org/img/wn/${iconid}.png

	}
	//`https:openweathermap.org/img/wn/${iconid}.png`
	@property(String)
	get city() {
		return this.#city.Name;
	}
	set city(city: string) {
		this.#city.Name = city;
		this.#city.lon = -1;
		this.notify("city")
	}

	// TODO make this be able to disable
	/** WARN ATTENTION I NEED TO USE THE IP ADDRESS FOR GEOLOCATOR
	 * PURPOSES HERE IT GOES DIRECTLY TO THE CLIMATE API SO THERE SHOULD NOT BE
	 * ANY PROBLEMS, STILL IF YOU DONT LIKE THIS PLEASE DISABLE IT*/
	async findCity() {
		let ip;
		await httpGet("https://ifconfig.me")
			.then(({ body }) => { ip = body })
			.catch(i => console.error(i))
		await httpGet(`https://ipapi.co/${ip}/city/`).then(({ body }) => {
			this.#city.Name = body
			this.#city.lon = -1;
		}).catch(i => console.error(i))
	}
	/**----------------------------*/
	@property()
	get properties(): WeatherProperties {
		return this.#properties;
	}
	async update(city?: string | undefined | null, find?: boolean | undefined | null): Promise<WeatherProperties> {
		if ((city === undefined || city === null) && find === true) {
			await this.findCity()
		}
		if (city !== undefined && city !== null) {
			this.#city.Name = city;
		} this.#properties = responseToWeather(await this.#getRequest(this.#city.Name)); this.notify("properties")
		return this.#properties;
	}
	/** To use the find function if the city to null*/
	constructor(city?: string | null, find?: boolean | null) {
		super();
		exec(["bash", "-c", `if [ ! -d "${CACHE}weather" ];
then mkdir ${CACHE}weather;
fi`])
		this.constructorWrapper(city, find).catch(e => console.error(e))
	}
	async constructorWrapper(city?: string | null, find?: boolean | null) {
		if (city != null) this.#city.Name = city;
		await this.update(city, find).catch((r) => { console.error(r) })
	}

}

