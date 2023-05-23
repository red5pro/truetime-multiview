/*
Copyright © 2015 Infrared5, Inc. All rights reserved.

The accompanying code comprising examples for use solely in conjunction with Red5 Pro (the "Example Code")
is  licensed  to  you  by  Infrared5  Inc.  in  consideration  of  your  agreement  to  the  following
license terms  and  conditions.  Access,  use,  modification,  or  redistribution  of  the  accompanying
code  constitutes your acceptance of the following license terms and conditions.

Permission is hereby granted, free of charge, to you to use the Example Code and associated documentation
files (collectively, the "Software") without restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

The Software shall be used solely in conjunction with Red5 Pro. Red5 Pro is licensed under a separate end
user  license  agreement  (the  "EULA"),  which  must  be  executed  with  Infrared5,  Inc.
An  example  of  the EULA can be found on our website at: https://account.red5pro.com/assets/LICENSE.txt.

The above copyright notice and this license shall be included in all copies or portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,  INCLUDING  BUT
NOT  LIMITED  TO  THE  WARRANTIES  OF  MERCHANTABILITY, FITNESS  FOR  A  PARTICULAR  PURPOSE  AND
NONINFRINGEMENT.   IN  NO  EVENT  SHALL INFRARED5, INC. BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN  AN  ACTION  OF  CONTRACT,  TORT  OR  OTHERWISE,  ARISING  FROM,  OUT  OF  OR  IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
/* global red5prosdk */
// import CustomControls from "./controls";

/**
 * A Subscriber Class that utilizes the Red5 Pro HTML SDK to subscribe to a stream.
 * Additionally, it has recognition of being considered the "main" stream, and will
 * act accordingly to to provide Live Seek capability.
 *
 * Live Seek capability requires the inclusion of HLS.js.
 * https://github.com/video-dev/hls.js/
 */

import { query } from './url-util.js'

const { debugMode } = query()

const RETRY_DELAY = 2000

// The default liveSeek configuration for Red5 Pro HTML SDK.
// This is used to enable Live Seek capability.
const liveSeekConfig = {
  enabled: false,
  // The baseURL is defaulted to the provided `host` value.
  // If the VOD files are located elsewhere, this or `fullURL` should be provided.
  baseURL: undefined,
  // The fullURL is the full path to the VOD files.
  fullURL: undefined,
  // The default is to look for HLS.js on the global scope, but you can provide a reference here.
  hlsjsRef: undefined,
  // By default, Live Seek will generate a HLS video element as a sibling to the live stream video element.
  // You can override that and define the element to use here.
  hlsElement: undefined,
  // Setting this to true will use the playback controls from the Red5 Pro HTML SDK, which are customizable.
  // Setting to false you will need to integrate external controls. Use with caution.
  usePlaybackControlsUI: true,
  // Options that are passed directly to the HLS.js instance.
  options: {
    debug: debugMode,
    backBufferLength: 0,
    // autoStartLoad: false,
    // liveSyncDurationCount: 10,
  },
}

/**
 * Returns the id of the video element for the provided stream name.
 * @param {String} streamName
 * @returns String
 */
const getIdFromStreamName = (streamName) => {
  return `${streamName}-video`
}

/**
 * Generates the subscriber element for playback.
 * @param {Obect} configuration
 * @param {HTMLElement} container The parent node to attach the element.
 * @param {String} labelText The label to display for the subscriber.
 * @returns HTMLElement
 */
const generateElement = (configuration, container, labelText) => {
  const { streamName } = configuration
  const element = document.createElement('div')
  element.classList.add('subscriber')
  const video = document.createElement('video')
  video.classList.add('subscriber_video')
  // video.setAttribute("controls", "controls");
  video.setAttribute('autoplay', 'autoplay')
  video.setAttribute('playsinline', 'playsinline')
  video.setAttribute('muted', 'muted')
  video.setAttribute('controlsList', 'nodownload')
  video.id = getIdFromStreamName(streamName)
  const label = document.createElement('p')
  label.textContent = labelText
  label.classList.add('subscriber_label')
  label.classList.add('unselectable')
  element.appendChild(video)
  element.appendChild(label)
  container.appendChild(element)
  return element
}

/**
 * Generates a generate notification element for the provided message.
 * @param {String} message
 * @returns HTMLElement
 */
const generateNotification = (message) => {
  const notification = document.createElement('div')
  notification.classList.add('subscriber_notification')
  notification.classList.add('unselectable')
  const messageElement = document.createElement('p')
  messageElement.classList.add('subscriber_notification-message')
  messageElement.textContent = message
  notification.appendChild(messageElement)
  return notification
}

// List of events that will trigger a reconnection attempt.
const reconnectEvents = [
  'Connect.Failure',
  'Subscribe.InvalidName',
  'Subscribe.Play.Unpublish',
  'Subscribe.Connection.Closed',
]

/**
 * A Subscriber Class that utilizes the Red5 Pro HTML SDK to subscribe to a stream and support live Stream Switching and Seeking.
 */
class Subscriber {
  constructor() {
    this.isMain = false
    this.subscriber = undefined
    this.configuration = undefined
    this.onselect = undefined
    this.onunsupported = undefined
    this.onautoplaymuted = undefined
    this.controls = undefined
    this.retryTimeout = 0
    this.streamConfigurationToSwitchTo = undefined
    this.destroyed = false
    this.hlsElement = undefined
    this.hlsControl = undefined
    this.durationHandler = this.onHLSDurationLoad.bind(this)
    this.eventHandler = this.onSubscriberEvent.bind(this)
  }

  /**
   * Event handler on duration to trigger start load of HLS.js.
   */
  onHLSDurationLoad() {
    this.hlsElement.removeEventListener('durationchange', this.durationHandler)
    if (this.hlsControl) {
      this.hlsControl.startLoad(this.hlsElement.duration - 6)
    }
  }

  /**
   * Event handler for the subscriber as being seekable.
   * @param {*} param0
   */
  onHLSInitialized({ hlsControl, hlsElement }) {
    this.hlsControl = hlsControl
    this.hlsElement = hlsElement
    this.hlsElement.addEventListener('durationchange', this.durationHandler)
  }

  /**
   * General event handler for all subscriber events.
   * @param {SubscriberEvent} event
   */
  onSubscriberEvent(event) {
    const { type, data } = event
    const name = this.configuration.label || this.configuration.streamName
    if (type !== 'Subscribe.Time.Update') {
      console.log(`[Subscriber:${name}]`, type, data)
      if (type === 'WebRTC.LiveSeek.Unsupported') {
        // Notify of unsupported Live Seek.
        if (this.onunsupported) {
          this.onunsupported.apply(null, [this])
        }
      } else if (type === 'Subscribe.Autoplay.Muted') {
        // Notify of autoplay muted.
        if (this.onautoplaymuted) {
          this.onautoplaymuted.apply(null, [this])
        }
      } else if (type === 'WebRTC.LiveSeek.Enabled') {
        const { hlsControl, hlsElement } = data
        this.onHLSInitialized({ hlsControl, hlsElement })
      } else if (type === 'WebRTC.DataChannel.Message') {
        // Stream Switch recognition.
        const { message } = data
        const json = JSON.parse(message.data)
        if (json.data.type === 'result' && json.data.message) {
          if (json.data.message === 'Stream switch: Success') {
            this.onSwitchTo()
          }
        }
      } else if (type === 'WebRTC.Subscribe.StreamSwitch') {
        // Stream Switch recognition.
        this.onSwitchTo()
      } else if (type === 'Subscribe.Playback.Change') {
        if (!this.isMain) {
          this.subscriber.mute()
          this.subscriber.muteAudio()
        }
      } else if (reconnectEvents.indexOf(type) > -1) {
        this.setAvailable(false)
        this.retry()
      }
    }
  }

  /**
   * Handler for once the stream has been successfully switched to another stream.
   */
  onSwitchTo() {
    this.configuration = {
      ...this.configuration,
      ...this.streamConfigurationToSwitchTo,
    }
    this.streamConfigurationToSwitchTo = undefined
    const video = this.element.querySelector('.subscriber_video')
    const label = this.element.querySelector('.subscriber_label')
    label.textContent =
      this.configuration.label || this.configuration.streamName
    this.subscriber.seekTo(1)
    if (this.isMain) {
      // this.subscriber.unmute();
      // this.subscriber.unmuteAudio();
    } else {
      this.subscriber.mute()
      this.subscriber.muteAudio()
    }
  }

  /**
   * Initializes the subscriber for playback and optional Live Seek capabilities.
   * @param {Object} configuration
   * @param {HTMLElement} container
   * @returns Subscriber
   */
  async init(configuration, container) {
    if (this.subscriber) {
      await this.stop()
    }
    const { liveSeek } = configuration
    this.configuration = {
      ...configuration,
      mediaElementId: getIdFromStreamName(configuration.streamName),
      liveSeek: liveSeek ? { ...liveSeekConfig, ...liveSeek } : liveSeekConfig,
    }
    const { label, streamName } = this.configuration
    console.log('[Subscriber] configuration', this.configuration)
    if (!this.element) {
      this.element = generateElement(
        this.configuration,
        container,
        label || streamName
      )
    }
    try {
      this.subscriber = new red5prosdk.WHEPClient()
      this.subscriber.on('*', this.eventHandler)
      await this.subscriber.init(this.configuration)
      // if (this.configuration.liveSeek.enabled) {
      // 	this.controls = new CustomControls(this.subscriber, this.element);
      // }
    } catch (e) {
      this.setAvailable(false)
      console.error(`[Subscriber:${this.configuration.label}]`, e)
      this.retry()
    }
    return this
  }

  /**
   * Starts the playback session.
   */
  async start() {
    if (this.subscriber) {
      await this.subscriber.subscribe()
    }
  }

  /**
   * Stops the playback session.
   */
  async stop() {
    if (!this.subscriber) {
      return
    }
    try {
      this.subscriber.off('*', this.eventHandler)
      await this.subscriber.unsubscribe()
      this.subscriber = undefined
    } catch (e) {
      console.warn(e)
    }
  }

  /**
   * Destroys the playback session.
   */
  async destroy() {
    this.destroyed = true
    try {
      await this.stop()
    } catch (e) {
      console.warn(e)
    } finally {
      const parent = this.element.parentNode
      parent.removeChild(this.element)
      this.isMain = false
    }
  }

  /**
   *
   * @returns Attempts to retry playback.
   */
  async retry() {
    clearTimeout(this.retryTimeout)
    if (this.destroyed) {
      return
    }
    await this.stop()
    this.retryTimeout = setTimeout(async () => {
      clearTimeout(this.retryTimeout)
      if (this.destroyed) {
        return
      }
      try {
        this.subscriber = new red5prosdk.WHEPClient()
        this.subscriber.on('*', this.eventHandler)
        await this.subscriber.init(this.configuration)
        await this.subscriber.subscribe()
        this.setAvailable(true)
      } catch (e) {
        this.setAvailable(false)
        console.error(`[Subscriber:${this.configuration.label}]`, e)
        this.retry()
      }
    }, RETRY_DELAY)
  }

  /**
   * Request to switch to another stream.
   * @param {Object} configuration
   */
  switchTo(configuration) {
    const { app, streamName: previousStreamName } = this.configuration
    const regex = new RegExp(`^${app}/`)
    const { streamName } = configuration
    const switchPath = regex.exec(streamName)
      ? streamName
      : `${app}/${streamName}`
    this.streamConfigurationToSwitchTo = configuration
    console.log('[Subscriber] switchStreams', previousStreamName, streamName)
    this.subscriber.callServer('switchStreams', [
      {
        path: switchPath,
        isImmediate: true,
      },
    ])
  }

  /**
   * Defines this Subscriber instance role as considered the main Live Seek stream.
   * @param {Boolean} enabled Flag to enable Live Seek on this Subscriber instance.
   * @param {HTMLElement} container
   */
  setAsMain(enabled, container) {
    this.isMain = enabled
    const video = this.element.querySelector('.subscriber_video')
    const label = this.element.querySelector('.subscriber_label')
    if (enabled) {
      label.classList.add('subscriber_label-top')
      // video.classList.add("red5pro-media");
      // video.setAttribute("controls", "controls");
      const parent = this.element.parentNode
      if (container) {
        parent.removeChild(this.element)
        container.appendChild(this.element)
      }
      video.removeAttribute('muted')
      this.subscriber.unmute()
      this.subscriber.unmuteAudio()
      this.subscriber.seekTo(1)
    } else {
      // video.classList.remove("red5pro-media");
      video.removeAttribute('controls')
      this.element.addEventListener('click', () => {
        if (this.onselect) {
          this.onselect.apply(null, [this, this.getConfiguration()])
        }
      })
      this.subscriber.mute()
      this.subscriber.muteAudio()
    }
  }

  /**
   * Defines this Subscriber instance as available for playback.
   * @param {Boolean} available
   */
  setAvailable(available) {
    let notification = this.element.querySelector('.subscriber_notification')
    if (available && notification) {
      notification.parentNode.removeChild(notification)
    } else if (!notification && !available) {
      notification = generateNotification(
        'Stream temporarily unavailable.',
        this.element
      )
      this.element.appendChild(notification)
    }
  }

  /**
   * Returns the provided configuration in `init` or `switchTo`.
   * @returns Object
   */
  getConfiguration() {
    return this.configuration
  }

  /**
   * Returns flag of this Subscriber instance being considered the main Live Seek stream.
   * @returns Boolean
   */
  getIsMain() {
    return this.isMain
  }
}

export default Subscriber
