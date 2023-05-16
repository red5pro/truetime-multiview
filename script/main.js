/* global red5prosdk */
import { query } from "./url-util.js";
import { showError, closeError, showWarning } from "./modal-util.js";
import Subscriber from "./subscriber.js";
const {
	scriptURL,
	host,
	app,
	abr,
	abrLow,
	abrHigh,
	streamManager,
	streams: streamsQueryList,
} = query();

// TODO: Logic of stream in main video going away and being replaced by next stream,
// while also removing the previous subscriber thumbnail.

// TODO: SDK update for on switchStreams, swaps HLS playback.

let streamsList = []; // [{label:<string>, streamName:<string>}]
let subscriberList = []; // [Subscriber]
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
		let { streamName } = stream;
		if (index === 0 && !mainStream) {
			sub = await new Subscriber().init(
				{
					...baseConfig,
					...stream,
					streamName: abr ? `${streamName}_${abrHigh}` : streamName,
					maintainStreamVariant: true,
					liveSeek: { enabled: true },
				},
				document.querySelector(".main-video-container")
			);
			sub.setAsMain(true);
			sub.onunsupported = onLiveSeekUnsupported;
			mainStream = sub;
		} else {
			sub = await new Subscriber().init(
				{
					...baseConfig,
					...stream,
					streamName: abr ? `${streamName}_${abrLow}` : streamName,
					maintainStreamVariant: true,
				},
				document.querySelector(".secondary-video-container")
			);
			sub.setAsMain(false);
			sub.onselect = onSwitchStream;
		}
		if (sub) {
			sub.start();
			subscriberList.push(sub);
		}
	});
};

const removeOldStreams = async (oldStreams) => {
	oldStreams.forEach((stream) => {
		const { streamName: toRemoveStreamName } = stream;
		let subscriber = subscriberList.find((sub) => {
			const configuration = sub.getConfiguration();
			const { streamName } = configuration;
			return streamName === toRemoveStreamName;
		});
		if (subscriber) {
			const index = subscriberList.indexOf(subscriber);
			if (subscriber.getIsMain()) {
				if (subscriberList.length > 1) {
					subscriber.destroy();
					const promoteIndex = index === 0 ? 1 : 0;
					const subscriberToPromote = subscriberList[promoteIndex];
					subscriberList.splice(promoteIndex, 1);
					promoteToMain(subscriberToPromote);
				} else {
					subscriber.destroy();
				}
				mainStream = undefined;
			} else {
				subscriber.destroy();
			}
			subscriberList.splice(index, 1);
		}
	});
};

const promoteToMain = async (subscriber) => {
	const configuration = subscriber.getConfiguration();
	const { streamName } = configuration;
	subscriber.destroy();
	const sub = await new Subscriber().init(
		{
			...configuration,
			streamName: abr ? `${streamName}_${abrHigh}` : streamName,
			maintainStreamVariant: true,
			liveSeek: { enabled: true },
		},
		document.querySelector(".main-video-container")
	);
	sub.setAsMain(true);
	sub.start();
	subscriberList.push(sub);
	mainStream = sub;
};

const onLiveSeekUnsupported = () => {
	showWarning(
		"Live Seek Unsupported",
		"Live seek is not supported by this browser. You will only be able to select and watch live streams."
	);
};

const onSwitchStream = (toSubscriber, configuration) => {
	let { label, streamName } = configuration;
	let { label: fromLabel, streamName: fromStreamName } =
		mainStream.getConfiguration();

	mainStream.switchTo({
		label,
		streamName: abr ? `${streamName}_${abrHigh}` : streamName,
	});
	toSubscriber.switchTo({
		label: fromLabel,
		streamName: abr ? `${fromStreamName}_${abrLow}` : fromStreamName,
	});
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
			removeOldStreams(oldStreams);
			let t = setTimeout(() => {
				clearTimeout(t);
				start();
			}, UPDATE_INTERVAL);
		} else {
			// If no scriptURL, we are using the streams query parameter to load the Map of streams.
			streamsList = streamsQueryList;
			const { newStreams } = updateStreamsList(streamsList);
			addNewStreams(newStreams);
		}
	} catch (error) {
		console.error(error);
		showError("Error", error.message);
	}
};

start();
