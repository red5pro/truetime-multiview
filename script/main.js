/* global red5prosdk */
import { query } from "./url-util.js";
import { showError, closeError } from "./modal-util.js";
import Subscriber from "./subscriber.js";
const {
	scriptURL,
	host,
	app,
	abr,
	streamManager,
	streams: streamsQueryList,
} = query();

let streamsList = []; // [{label:<string>, streamName:<string>}]
let mainStream = undefined;
const UPDATE_INTERVAL = 5000;
const NAME = "[RTMV]";

red5prosdk.setLogLevel("debug");
console.log(NAME, "scriptURL", scriptURL);
console.log(NAME, "host", host);
console.log(NAME, "app", app);
console.log(NAME, "streams", streamsQueryList);

const baseConfig = {
	host,
	app: app || "live",
};

const getStreamMapFromScriptURL = async (scriptURL) => {
	let list = [];
	const response = await fetch(scriptURL);
	const json = await response.json();
	// Accepted JSON payloads:
	// * [ <string> ]
	// * [ { name: <string> } ]
	// * [ { name: <string>, label: <string> } ]
	// * { <string>: <string> }
	if (Object.prototype.toString.call(json) === "[object Array]") {
		json.forEach((item) => {
			if (typeof item === "object" && item.name) {
				list.push({
					label: item.label || item.name,
					streamName: item.name,
				});
			} else if (typeof item === "string") {
				list.push({ label: item, streamName: item });
			}
		});
	} else {
		for (const key in json) {
			list.push({
				label: key,
				streamName: json[key],
			});
		}
	}
	return list;
};

const updateStreamsList = (list) => {
	// Parse the Array and find new streams based on existing streamsList.
	let newStreams = list.filter((item) => {
		return !streamsList.some((stream) => {
			return (
				stream.label === item.label && stream.streamName === item.streamName
			);
		});
	});
	// Parse the Array and find removed streams based on existing streamsList.
	let oldStreams = streamsList.filter((item) => {
		return !list.some((stream) => {
			return (
				stream.label === item.label || stream.streamName === item.streamName
			);
		});
	});
	console.log(NAME, "newStreams", newStreams);
	console.log(NAME, "oldStreams", oldStreams);
	streamsList = list;
	return { newStreams, oldStreams };
};

const addNewStreams = (newStreams) => {
	newStreams.forEach(async (stream, index) => {
		let sub;
		if (index === 0) {
			// maintainStreamVariant: true
			// Uses switchStream API to switch between thumbnails.
			sub = await new Subscriber().init(
				{ ...baseConfig, ...stream, maintainStreamVariant: true },
				document.querySelector(".main-video-container")
			);
			sub.setAsMain(true, onSwitchStream);
			mainStream = sub;
		} else {
			sub = await new Subscriber().init(
				{ ...baseConfig, ...stream },
				document.querySelector(".secondary-video-container")
			);
			sub.setAsMain(false, onSwitchStream);
		}
		sub.start();
	});
};

const onSwitchStream = (toSubscriber) => {
	console.log(NAME, "onSwitchStream:subscriber", toSubscriber);
	// TODO: If abr is set, switch the ladders.
	const { label, streamName } = toSubscriber.getConfiguration();
	const { label: fromLabel, streamName: fromStreamName } =
		mainStream.getConfiguration();
	mainStream.switchTo({ label, streamName });
	toSubscriber.switchTo({ label: fromLabel, streamName: fromStreamName });
	mainStream = toSubscriber;
};

const start = async () => {
	try {
		closeError();
		if (scriptURL) {
			// If scriptURL is provided, then we are loaidng the Map of streams from a remote source.
			const list = await getStreamMapFromScriptURL(scriptURL);
			console.log(NAME, list);
			const { newStreams, oldStreams } = updateStreamsList(list);
			addNewStreams(newStreams);
			// let t = setTimeout(() => {
			// 	clearTimeout(t);
			// 	start();
			// }, UPDATE_INTERVAL);
		} else {
			// If no scriptURL, we are using the streams query parameter to load the Map of streams.
			streamsList = streamsQueryList;
			const { newStreams, oldStreams } = updateStreamsList(streamsList);
			addNewStreams(newStreams);
		}
	} catch (error) {
		console.error(error);
		showError("Error", error.message);
	}
};

start();
