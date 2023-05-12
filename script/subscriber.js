/* global red5prosdk */

// TODO: Show "temporarily unavailable" when stream is not available.

const RETRY_DELAY = 2000;
const baseSeekableConfig = {
	liveSeek: {
		enable: true,
		baseURL: undefined,
		fullURL: undefined,
		hlsjsRef: undefined,
		hlsElement: undefined,
		usePlaybackControlsUI: true,
		options: { debug: false, backBufferLength: 0 },
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
		this.retryTimeout = 0;
		this.streamConfigurationToSwitchTo = undefined;
		this.destroyed = false;
		this.eventHandler = this.onSubscriberEvent.bind(this);
	}

	onSubscriberEvent(event) {
		const { type, data } = event;
		if (type !== "Subscribe.Time.Update") {
			console.log("[Subscriber]", type, data);
			if (type === "WebRTC.DataChannel.Message") {
				const { message } = data;
				const json = JSON.parse(message.data);
				if (json.data.type === "result" && json.data.message) {
					if (json.data.message === "Stream switch: Success") {
						this.configuration = {
							...this.configuration,
							...this.streamConfigurationToSwitchTo,
						};
						this.streamConfigurationToSwitchTo = undefined;
						this.element.querySelector(".subscriber_label").textContent =
							this.configuration.label || this.configuration.streamName;
						// Note: When stream switching, we return to live.
						// TODO: Set playhead to current time.
					}
				}
			} else if (reconnectEvents.indexOf(type) > -1) {
				this.setAvailable(false);
				this.retry();
			}
		}
	}

	async init(configuration, container) {
		if (this.subscriber) {
			await this.stop();
		}
		this.configuration = {
			...configuration,
			...baseSeekableConfig,
			mediaElementId: getIdFromStreamName(configuration.streamName),
		};
		const { label, streamName } = this.configuration;
		console.log("[Subscriber] configuration", this.configuration);
		this.element = generateElement(
			this.configuration,
			container,
			label || streamName
		);
		try {
			this.subscriber = new red5prosdk.WHEPClient();
			this.subscriber.on("*", this.eventHandler);
			await this.subscriber.init(this.configuration);
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
			parentNode.removeChild(this.element);
		}
	}

	async retry() {
		if (this.destroyed) {
			return;
		}
		await this.stop();
		clearTimeout(this.retryTimeout);
		this.retryTimeout = setTimeout(async () => {
			clearTimeout(this.retryTimeout);
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

	setAsMain(enabled) {
		this.isMain = enabled;
		const video = this.element.querySelector(".subscriber_video");
		if (enabled) {
			video.classList.add("red5pro-media");
			video.setAttribute("controls", "controls");
		} else {
			video.classList.remove("red5pro-media");
			video.removeAttribute("controls");
			this.element.addEventListener("click", () => {
				if (this.onselect) {
					this.onselect.apply(null, [this, this.getConfiguration()]);
				}
			});
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
}

export default Subscriber;
