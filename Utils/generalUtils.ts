import GLib from "gi://GLib?version=2.0";
import Soup from "gi://Soup?version=3.0";

/**
 *	```arr: Array<any>``` the array which will be searched
 *	```object: any``` The object where the properties are. It may also be a pure string
 *	```arrProperty: string | null``` In case the array is composed with object which need special propeties to compare. In case the array is not
 *  	composed of objects it can be nil
 *	```PossiblePlaces``` The possible places in the object the 
 *	```returnForm: string | null``` if null returns the value, if not null then it returns it in the form arr[found index][returnForm]
 *	TODO
 */
export function AdvancedFind(arr: Array<any>, object: any | null, /*isFunction: Boolean,*/ arrProperty: string | null, PossiblePlaces: string[] | string | null, returnForm: string | null): string | "N/A" {
	if (object == null) return "N/A"
	let searcher: string | string[] = PossiblePlaces == null ? object : !Array.isArray(PossiblePlaces) ? object[PossiblePlaces] : [];
	let finder: string[] = arrProperty ? arr.map(i => i[arrProperty]()) : arr;
	let turnerIndex: number;

	if (Array.isArray(searcher) && Array.isArray(PossiblePlaces)) {
		for (let i = 0; i < PossiblePlaces.length; i++) {
			searcher.push(object[PossiblePlaces[i]]());
		}
	}

	for (let j = 0; j < finder.length; j++) {
		if (!Array.isArray(searcher)) {
			if (finder[j].match(new RegExp(searcher, "gi"))) {
				turnerIndex = j;
			}
			continue;
		}
		for (let k of searcher) {
			if (finder[j].match(new RegExp(k, "gi"))) {
				turnerIndex = j;
			}
		}
	}
	turnerIndex ??= -1;
	if (!returnForm) {
		return turnerIndex >= 0 ? arr[turnerIndex] : "N/A"
	}
	return turnerIndex >= 0 ? arr[turnerIndex][returnForm]() : "N/A"

};
export function getLimitingWord(str: string, maxLength: number, possibleDividers: string | string[] = " "): string {
	if (str.length < maxLength) return str
	let turner: string = "";
	if (typeof possibleDividers == "string") {
		turner = testWithDivider(str, maxLength, possibleDividers)
	} else {
		let maxMin: [number, number] = [0, 0];
		let possibilities = possibleDividers.map(v => testWithDivider(str, maxLength, v));
		for (let pos = 0; pos < possibilities.length; pos++) {
			// console.log(`${possibilities[pos].length < maxLength - 2} and ${possibilities[pos].length > maxMin[1]}`);
			if (possibilities[pos].length < maxLength - 2 && possibilities[pos].length > maxMin[1]) {
				maxMin[0] = pos;
				maxMin[1] = possibilities[pos].length;
			}
			turner = possibilities[maxMin[0]]
		}

	}
	if (turner === null || turner.length > maxLength) return str.substring(0, maxLength - 2).trim() + "..."
	return turner.trim() + "...";
}

/** Does not support the case for more numbers than those set before*/
export function forceChar(value: number, wholes: number, decimals: number): string {
	const t: string[] = String(value).split(".");
	let over: string = t[0];
	let below: string = t[1] ?? "";
	while (over.length < wholes) {
		over = " " + over;
	}
	while (below.length < decimals) {
		below = below + "0";
	}
	return over + "." + below;
}
export function mkSigFigs(value: number, sigFigs?: number): number {
	let turner: number;
	const sigFig = sigFigs ?? 2
	turner = Math.round(value * Math.pow(10, sigFig));
	turner *= Math.pow(10, sigFig);
	return turner;
}

function testWithDivider(str: string, maxLength: number, divider: string): string {
	let sum = 0;
	let lastIndex: number | null = null;
	let arr = str.split(divider)
	for (let li = 0; li < arr.length; li++) {
		sum += arr[li].length + 1;
		if (sum > maxLength - 2) {
			lastIndex = li;
			break
		}
	}
	if (lastIndex === null || lastIndex == 0) {
		lastIndex = str.split(divider).length;
	}
	return str.split(divider).slice(0, lastIndex).join(divider);

}

export function httpGet(url: string): Promise<{ status: string, body: any | { [key: string]: any } }> {
	const session = new Soup.Session();
	const message = Soup.Message.new('GET', url);

	// Wrap send_and_read_async in a Promise
	return new Promise((resolve, reject) => {
		session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (_, result) => {
			try {
				const response = session.send_and_read_finish(result);
				const responseBody = response.get_data(); // Convert data to string
				const decodedBody = new TextDecoder().decode(responseBody!);
				let body;
				// making the status string is probably a war crime in some countries but anyway
				try {
					body = JSON.parse(decodedBody);
				}
				catch (e) {
					body = decodedBody;
				}
				resolve({ status: String(message.get_status()), body: body });
			} catch (error) {
				reject(error);
			}
		});
	});
}

