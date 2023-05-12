// https://server/?url=https://server/live/streams.jsp&host=server&app=live&CameraOne=cameraOne&CameraTwo=cameraTwo

export const query = () => {
	const searchParams = new URLSearchParams(window.location.search);
	let streams = [];
	const abrOpt = searchParams.get("abr");
	const smOpt = searchParams.get("sm");
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
	let streamManager = smOpt ? smOpt.toLowerCase() === "true" : false;
	searchParams.forEach((value, key) => {
		if (key !== "url" && key !== "host" && key !== "app") {
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
		streamManager,
		streams,
	};
};
