// https://server/?url=https://server/live/streams.jsp&host=server&app=live&CameraOne=cameraOne&CameraTwo=cameraTwo

const paramExclude = [
	"url",
	"host",
	"app",
	"demo",
	"debug",
	"embed",
	"sm",
	"abr",
	"abrlow",
	"abrhigh",
];

export const hasHostDefined = () => {
	const searchParams = new URLSearchParams(window.location.search);
	return searchParams.has("host");
};

export const query = () => {
	const searchParams = new URLSearchParams(window.location.search);
	let streams = [];
	const abrOpt = searchParams.get("abr");
	const abrLowOpt = searchParams.get("abrlow");
	const abrHighOpt = searchParams.get("abrhigh");
	const smOpt = searchParams.get("sm");
	const demoOpt = searchParams.get("demo");
	const debugOpt = searchParams.get("debug");
	const embedOpt = searchParams.get("embed");
	let scriptURL = searchParams.get("url")
		? decodeURIComponent(searchParams.get("url"))
		: undefined;
	let host = searchParams.get("host")
		? decodeURIComponent(searchParams.get("host"))
		: window.location.hostname;
	let app = searchParams.get("app")
		? decodeURIComponent(searchParams.get("app"))
		: undefined;
	let abr = abrOpt ? abrOpt.toLowerCase() === "true" : false;
	let abrLow = abrLowOpt ? parseInt(abrLowOpt, 10) : 3;
	let abrHigh = abrHighOpt ? parseInt(abrHighOpt, 10) : 1;
	let streamManager = smOpt ? smOpt.toLowerCase() === "true" : false;
	let demoMode = demoOpt ? demoOpt.toLowerCase() === "true" : false;
	let debugMode = debugOpt ? debugOpt.toLowerCase() === "true" : false;
	let embedMode = embedOpt ? embedOpt.toLowerCase() === "true" : false;
	searchParams.forEach((value, key) => {
		if (paramExclude.indexOf(key) === -1) {
			streams.push({
				label: decodeURIComponent(key),
				streamName: decodeURIComponent(value),
			});
		}
	});
	return {
		scriptURL,
		host,
		app,
		abr,
		abrLow,
		abrHigh,
		streamManager,
		streams,
		demoMode,
		debugMode,
		embedMode,
	};
};
