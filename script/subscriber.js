/* global red5prosdk */
// import CustomControls from "./controls";

import { query } from "./url-util.js";

const { debugMode } = query();

const RETRY_DELAY = 2000;
const liveSeekConfig = {
	enabled: false,
	baseURL: undefined,
	fullURL: undefined, // "https://todd-826.red5pro.net/live/streams/five.mp4",
	hlsjsRef: undefined,
	hlsElement: undefined,
	usePlaybackControlsUI: true, //false,
	options: {
		debug: debugMode,
		backBufferLength: 0,
		autoStartLoad: false,
		// liveSyncDurationCount: 10,
	},
};

const getIdFromStreamName = (streamName) => {
	return `${streamName}-video`;
};

const generateElement = (configuration, container, labelText) => {
	const { streamName } = configuration;
	const element = document.createElement("div");
	element.classList.add("subscriber");
	const video = document.createElement("video");
	video.classList.add("subscriber_video");
	// video.setAttribute("controls", "controls");
	video.setAttribute("autoplay", "autoplay");
	video.setAttribute("playsinline", "playsinline");
	video.setAttribute("muted", "muted");
	video.setAttribute("controlsList", "nodownload");
	video.id = getIdFromStreamName(streamName);
	const label = document.createElement("p");
	label.textContent = labelText;
	label.classList.add("subscriber_label");
	label.classList.add("unselectable");
	element.appendChild(video);
	element.appendChild(label);
	container.appendChild(element);
	return element;
};

const generateNotification = (message) => {
	const notification = document.createElement("div");
	notification.classList.add("subscriber_notification");
	notification.classList.add("unselectable");
	const messageElement = document.createElement("p");
	messageElement.classList.add("subscriber_notification-message");
	messageElement.textContent = message;
	notification.appendChild(messageElement);
	return notification;
};

const reconnectEvents = [
	"Connect.Failure",
	"Subscribe.InvalidName",
	"Subscribe.Play.Unpublish",
	"Subscribe.Connection.Closed",
];

class Subscriber {
	constructor() {
		this.isMain = false;
		this.subscriber = undefined;
		this.configuration = undefined;
		this.onselect = undefined;
		this.onunsupported = undefined;
		this.onautoplaymuted = undefined;
		this.controls = undefined;
		this.retryTimeout = 0;
		this.streamConfigurationToSwitchTo = undefined;
		this.destroyed = false;
		this.hlsElement = undefined;
		this.hlsControl = undefined;
		this.durationHandler = this.onHLSDurationLoad.bind(this);
		this.eventHandler = this.onSubscriberEvent.bind(this);
	}

	onHLSDurationLoad() {
		this.hlsElement.removeEventListener("durationchange", this.durationHandler);
		if (this.hlsControl) {
			this.hlsControl.startLoad(this.hlsElement.duration - 6);
		}
	}

	onHLSInitialized({ hlsControl, hlsElement }) {
		this.hlsControl = hlsControl;
		this.hlsElement = hlsElement;
		this.hlsElement.addEventListener("durationchange", this.durationHandler);
	}

	onSubscriberEvent(event) {
		const { type, data } = event;
		const name = this.configuration.label || this.configuration.streamName;
		if (type !== "Subscribe.Time.Update") {
			console.log(`[Subscriber:${name}]`, type, data);
			if (type === "WebRTC.LiveSeek.Unsupported") {
				if (this.onunsupported) {
					this.onunsupported.apply(null, [this]);
				}
			} else if (type === "Subscribe.Autoplay.Muted") {
				if (this.onautoplaymuted) {
					this.onautoplaymuted.apply(null, [this]);
				}
			} else if (type === "WebRTC.LiveSeek.Enabled") {
				const { hlsControl, hlsElement } = data;
				this.onHLSInitialized({ hlsControl, hlsElement });
			} else if (type === "WebRTC.DataChannel.Message") {
				const { message } = data;
				const json = JSON.parse(message.data);
				if (json.data.type === "result" && json.data.message) {
					if (json.data.message === "Stream switch: Success") {
						this.onSwitchTo();
					}
				}
			} else if (type === "WebRTC.Subscribe.StreamSwitch") {
				this.onSwitchTo();
			} else if (type === "Subscribe.Playback.Change") {
				if (!this.isMain) {
					this.subscriber.mute();
					this.subscriber.muteAudio();
				}
			} else if (reconnectEvents.indexOf(type) > -1) {
				this.setAvailable(false);
				this.retry();
			}
		}
	}

	onSwitchTo() {
		this.configuration = {
			...this.configuration,
			...this.streamConfigurationToSwitchTo,
		};
		this.streamConfigurationToSwitchTo = undefined;
		const video = this.element.querySelector(".subscriber_video");
		const label = this.element.querySelector(".subscriber_label");
		label.textContent =
			this.configuration.label || this.configuration.streamName;
		this.subscriber.seekTo(1);
		if (this.isMain) {
			// this.subscriber.unmute();
			// this.subscriber.unmuteAudio();
		} else {
			this.subscriber.mute();
			this.subscriber.muteAudio();
		}
	}

	async init(configuration, container) {
		if (this.subscriber) {
			await this.stop();
		}
		const { liveSeek } = configuration;
		this.configuration = {
			...configuration,
			mediaElementId: getIdFromStreamName(configuration.streamName),
			liveSeek: liveSeek ? { ...liveSeekConfig, ...liveSeek } : liveSeekConfig,
		};
		const { label, streamName } = this.configuration;
		console.log("[Subscriber] configuration", this.configuration);
		if (!this.element) {
			this.element = generateElement(
				this.configuration,
				container,
				label || streamName
			);
		}
		try {
			this.subscriber = new red5prosdk.WHEPClient();
			this.subscriber.on("*", this.eventHandler);
			await this.subscriber.init(this.configuration);
			// if (this.configuration.liveSeek.enabled) {
			// 	this.controls = new CustomControls(this.subscriber, this.element);
			// }
		} catch (e) {
			this.setAvailable(false);
			console.error(`[Subscriber:${this.configuration.label}]`, e);
			this.retry();
		}
		return this;
	}

	async start() {
		if (this.subscriber) {
			await this.subscriber.subscribe();
		}
	}

	async stop() {
		if (!this.subscriber) {
			return;
		}
		try {
			this.subscriber.off("*", this.eventHandler);
			await this.subscriber.unsubscribe();
			this.subscriber = undefined;
		} catch (e) {
			console.warn(e);
		}
	}

	async destroy() {
		this.destroyed = true;
		try {
			await this.stop();
		} catch (e) {
			console.warn(e);
		} finally {
			const parent = this.element.parentNode;
			parent.removeChild(this.element);
			this.isMain = false;
		}
	}

	async retry() {
		clearTimeout(this.retryTimeout);
		if (this.destroyed) {
			return;
		}
		await this.stop();
		this.retryTimeout = setTimeout(async () => {
			clearTimeout(this.retryTimeout);
			if (this.destroyed) {
				return;
			}
			try {
				this.subscriber = new red5prosdk.WHEPClient();
				this.subscriber.on("*", this.eventHandler);
				await this.subscriber.init(this.configuration);
				await this.subscriber.subscribe();
				this.setAvailable(true);
			} catch (e) {
				this.setAvailable(false);
				console.error(`[Subscriber:${this.configuration.label}]`, e);
				this.retry();
			}
		}, RETRY_DELAY);
	}

	switchTo(configuration) {
		const { app, streamName: previousStreamName } = this.configuration;
		const regex = new RegExp(`^${app}/`);
		const { streamName } = configuration;
		const switchPath = regex.exec(streamName)
			? streamName
			: `${app}/${streamName}`;
		this.streamConfigurationToSwitchTo = configuration;
		console.log("[Subscriber] switchStreams", previousStreamName, streamName);
		this.subscriber.callServer("switchStreams", [
			{
				path: switchPath,
				isImmediate: true,
			},
		]);
	}

	setAsMain(enabled, container) {
		this.isMain = enabled;
		const video = this.element.querySelector(".subscriber_video");
		const label = this.element.querySelector(".subscriber_label");
		if (enabled) {
			label.classList.add("subscriber_label-top");
			// video.classList.add("red5pro-media");
			// video.setAttribute("controls", "controls");
			const parent = this.element.parentNode;
			if (container) {
				parent.removeChild(this.element);
				container.appendChild(this.element);
			}
			video.removeAttribute("muted");
			this.subscriber.unmute();
			this.subscriber.unmuteAudio();
			this.subscriber.seekTo(1);
		} else {
			// video.classList.remove("red5pro-media");
			video.removeAttribute("controls");
			this.element.addEventListener("click", () => {
				if (this.onselect) {
					this.onselect.apply(null, [this, this.getConfiguration()]);
				}
			});
			this.subscriber.mute();
			this.subscriber.muteAudio();
		}
	}

	setAvailable(available) {
		let notification = this.element.querySelector(".subscriber_notification");
		if (available && notification) {
			notification.parentNode.removeChild(notification);
		} else if (!notification && !available) {
			notification = generateNotification(
				"Stream temporarily unavailable.",
				this.element
			);
			this.element.appendChild(notification);
		}
	}

	getConfiguration() {
		return this.configuration;
	}

	getIsMain() {
		return this.isMain;
	}
}

export default Subscriber;
