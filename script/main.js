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
An  example  of  the EULA can be found on our website at: https://account.red5.net/assets/LICENSE.txt.

The above copyright notice and this license shall be included in all copies or portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,  INCLUDING  BUT
NOT  LIMITED  TO  THE  WARRANTIES  OF  MERCHANTABILITY, FITNESS  FOR  A  PARTICULAR  PURPOSE  AND
NONINFRINGEMENT.   IN  NO  EVENT  SHALL INFRARED5, INC. BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN  AN  ACTION  OF  CONTRACT,  TORT  OR  OTHERWISE,  ARISING  FROM,  OUT  OF  OR  IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * Main app entry point for the Red5 Pro TrueTime MultiView.
 */
/* global red5prosdk */
import { query } from './url-util.js'
import { showError, closeError, showWarning } from './modal-util.js'
import Subscriber from './subscriber.js'
const {
  scriptURL,
  host,
  app,
  vod,
  vodBase,
  abr,
  abrLow,
  abrHigh,
  streamManager,
  nodeGroup,
  debugMode,
  intro,
  streams: streamsQueryList,
} = query()

let streamsList = [] // [{label:<string>, streamName:<string>}]
let subscriberList = [] // [Subscriber]
let mainStream = undefined
// If `url` query param is provided, this is the interval used in re-requesting streams from the service url..
const UPDATE_INTERVAL = 5000
const NAME = '[TTMV]'

red5prosdk.setLogLevel(debugMode ? 'debug' : 'error')
console.log(NAME, 'scriptURL', scriptURL)
console.log(NAME, 'host', host)
console.log(NAME, 'app', app)
console.log(NAME, 'streams', streamsQueryList)

// Base configuration for Subscriber instances.
const baseConfig = {
  host: host || window.location.hostname,
  app: app || 'live',
}

// Optional node group configuration for Stream Manager 2.0.
if (streamManager) {
  baseConfig.connectionParams = {
    nodeGroup: nodeGroup || 'default',
  }
}

/**
 * Loads and parses the JSON payload from the scriptURL to determine the list of streams to display.
 * @param {String} scriptURL
 * @returns
 */
const getStreamMapFromScriptURL = async (scriptURL) => {
  let list = []
  const response = await fetch(scriptURL)
  const json = await response.json()
  // Accepted JSON payloads:
  // * [ <string> ]
  // * [ { name: <string> } ]
  // * [ { name: <string>, label: <string> } ]
  // * [ { streamGuid: <string>, nodeRole: <string> } ]
  // * { <string>: <string> }
  if (Object.prototype.toString.call(json) === '[object Array]') {
    json.forEach((item) => {
      // SM 1.0 stream list payload.
      if (typeof item === 'object' && item.name) {
        if (!item.type || (item.type && item.type !== 'origin')) {
          list.push({
            label: item.label || item.name,
            streamName: item.name,
          })
        }
      } else if (typeof item === 'object' && item.streamGuid) {
        // SM 2.0 stream list payload >
        // If nodeRole matches /^edge/
        if (item.nodeRole && item.nodeRole.match(/^edge/)) {
          const guid = item.streamGuid
          // Split the stream name after the last / in the streamGuid.
          let parts = guid.split('/')
          if (parts.length > 1) {
            const streamName = parts.pop()
            const context = parts.join('/')
            if (context === app) {
              list.push({
                label: streamName,
                streamName,
              })
            }
          }
        }
      } else if (typeof item === 'string') {
        // streams.jsp payload >
        list.push({ label: item, streamName: item })
      }
    })
  } else {
    for (const key in json) {
      list.push({
        label: key,
        streamName: json[key],
      })
    }
  }
  return list
}

/**
 * Parses the updated list of streams and determines new and old streams to display or remove, respectively.
 * @param {Array} list [{label: <string>, streamName: <string>}]
 * @returns
 */
const updateStreamsList = (list) => {
  // Parse the Array and find new streams based on existing streamsList.
  let newStreams = list.filter((item) => {
    return !streamsList.some((stream) => {
      return (
        stream.label === item.label && stream.streamName === item.streamName
      )
    })
  })
  // Parse the Array and find removed streams based on existing streamsList.
  let oldStreams = streamsList.filter((item) => {
    return !list.some((stream) => {
      return (
        stream.label === item.label || stream.streamName === item.streamName
      )
    })
  })
  streamsList = list
  return { newStreams, oldStreams }
}

/**
 * Reorder the "tray" DOM of non-main streams to original order of listing.
 */
const reorder = () => {
  // Find which item out of streamsList is the main stream.
  const mainSub = subscriberList.find((sub) => sub.getIsMain())
  if (!mainSub) {
    return
  }
  const mainStreamName = mainSub.getConfiguration().streamName
  let secondaryOrder = [...streamsList].filter((item) => {
    return item.streamName !== mainStreamName
  })

  var secondary = document.querySelector('.secondary-video-container')
  var secondaryChildren = [...secondary.children]
  secondaryChildren
    .sort((streamA, streamB) => {
      const streamAListing = subscriberList.find((sub) => {
        return !sub.getIsMain() && sub.getElement() === streamA
      })
      const streamBListing = subscriberList.find((sub) => {
        return !sub.getIsMain() && sub.getElement() === streamB
      })
      if (!streamAListing) return 1
      if (!streamBListing) return -1
      const streamAName = streamAListing.getConfiguration().streamName
      const streamBName = streamBListing.getConfiguration().streamName
      var indexA = streamsList.findIndex(
        (item) => item.streamName === streamAName
      )
      var indexB = streamsList.findIndex(
        (item) => item.streamName === streamBName
      )
      return indexA > indexB ? 1 : -1
    })
    .forEach((node) => secondary.appendChild(node))
}

/**
 * Adds any new streams as Susbcriber instances to the display based on query params and configuration.
 * @param {Array} newStreams [{label: <string>, streamName: <string>}]
 */
const addNewStreams = async (newStreams) => {
  // const colors = ['green', 'blue', 'yellow']
  return await Promise.all(
    newStreams.map(async (stream, index) => {
      let sub
      let { streamName } = stream
      if (index === 0 && !mainStream) {
        const name = abr ? `${streamName}_${abrHigh}` : streamName
        const fullURL = vodBase ? `${vodBase}/${name}.m3u8` : undefined
        sub = await new Subscriber().init(
          {
            ...baseConfig,
            ...stream,
            streamName: name,
            maintainStreamVariant: true,
            liveSeek: { enabled: vod, fullURL: fullURL },
          },
          document.querySelector('.main-video-container')
        )
        sub.setAsMain(true)
        sub.onunsupported = onLiveSeekUnsupported
        sub.onautoplaymuted = onAutoPlayMuted
        sub.onswitch = onSwitchSuccess

        mainStream = sub
      } else {
        sub = await new Subscriber().init(
          {
            ...baseConfig,
            ...stream,
            streamName: abr ? `${streamName}_${abrLow}` : streamName,
            maintainStreamVariant: true,
          },
          document.querySelector('.secondary-video-container')
          // colors[index - 1]
        )
        sub.setAsMain(false)
        sub.onselect = onSwitchStream
      }
      if (sub) {
        sub.start()
        subscriberList.push(sub)
      }
      return true
    })
  )
}

/**
 * Removes any streams that are no longer in the list of streams to display.
 * @param {Array} oldStreams [{label: <string>, streamName: <string>}]
 */
const removeOldStreams = async (oldStreams) => {
  oldStreams.forEach((stream) => {
    const { streamName: toRemoveStreamName } = stream
    let subscriber = subscriberList.find((sub) => {
      const configuration = sub.getConfiguration()
      const { streamName } = configuration
      return streamName === toRemoveStreamName
    })
    if (subscriber) {
      const index = subscriberList.indexOf(subscriber)
      if (subscriber.getIsMain()) {
        if (subscriberList.length > 1) {
          subscriber.destroy()
          const promoteIndex = index === 0 ? 1 : 0
          const subscriberToPromote = subscriberList[promoteIndex]
          subscriberList.splice(promoteIndex, 1)
          promoteToMain(subscriberToPromote)
        } else {
          subscriber.destroy()
        }
        mainStream = undefined
      } else {
        subscriber.destroy()
      }
      subscriberList.splice(index, 1)
    }
  })
}

/**
 * Promotes a non-main stream to the main display.
 * This can occur when the main stream is removed from the list of available streams.
 * If that happens, move one of the secondary streams to the main display (if one exists).
 * @param {Subscriber} subscriber
 */
const promoteToMain = async (subscriber) => {
  const configuration = subscriber.getConfiguration()
  const { streamName } = configuration
  subscriber.destroy()
  const name = abr ? `${streamName}_${abrHigh}` : streamName
  const fullURL = vodBase ? `${vodBase}/${name}.m3u8` : undefined
  const sub = await new Subscriber().init(
    {
      ...configuration,
      streamName: name,
      maintainStreamVariant: true,
      liveSeek: { enabled: vod, fullURL: fullURL },
    },
    document.querySelector('.main-video-container')
  )
  sub.setAsMain(true)
  sub.start()
  subscriberList.push(sub)
  sub.onunsupported = onLiveSeekUnsupported
  sub.onautoplaymuted = onAutoPlayMuted
  sub.onswitch = onSwitchSuccess

  mainStream = sub
  onSwitchSuccess(sub, configuration)
}

/**
 * Notification of Live Seek not being supported by the browser.
 */
const onLiveSeekUnsupported = () => {
  showWarning(
    'Live Seek Unsupported',
    'Live seek is not supported by this browser. You will only be able to select and watch live streams.'
  )
}

/**
 * Notification that auto play is muted by the browser (usuaully for security purposes).
 */
const onAutoPlayMuted = () => {
  showWarning(
    'Auto Play Muted',
    'Auto play is muted by this browser. You will need to manually unmute the video.'
  )
}

/**
 * Request to switch the main stream to a different stream.
 * @param {Subscriber} toSubscriber
 * @param {Object} configuration
 */
const onSwitchStream = (toSubscriber, configuration) => {
  let { label, streamName } = configuration
  let { label: fromLabel, streamName: fromStreamName } =
    mainStream.getConfiguration()

  fromStreamName = abr
    ? fromStreamName.substr(0, fromStreamName.indexOf(`_${abrHigh}`))
    : fromStreamName
  streamName = abr
    ? streamName.substr(0, streamName.indexOf(`_${abrLow}`))
    : streamName

  mainStream.switchTo({
    label,
    streamName: abr ? `${streamName}_${abrHigh}` : streamName,
  })
  toSubscriber.switchTo({
    label: fromLabel,
    streamName: abr ? `${fromStreamName}_${abrLow}` : fromStreamName,
  })

  window.scrollTo(0, 0)
}

const onSwitchSuccess = (toSubscriber, configuration) => {
  requestAnimationFrame(() => {
    reorder()
  })
}

/**
 * Start up the application.
 */
const start = async () => {
  try {
    closeError()
    if (scriptURL) {
      // If scriptURL is provided, then we are loaidng the Map of streams from a remote source.
      const list = await getStreamMapFromScriptURL(scriptURL)
      console.log(NAME, list)
      const { newStreams, oldStreams } = updateStreamsList(list)
      await addNewStreams(newStreams)
      removeOldStreams(oldStreams)
      reorder()
      let t = setTimeout(() => {
        clearTimeout(t)
        start()
      }, UPDATE_INTERVAL)
    } else {
      // If no scriptURL, we are using the streams query parameter to load the Map of streams.
      const { newStreams } = updateStreamsList(streamsQueryList)
      await addNewStreams(newStreams)
      reorder()
    }
  } catch (error) {
    console.error(error)
    showError('Error', error.message)
  }
}

/**
 * Shutdown all subscribers.
 */
const shutdown = () => {
  while (subscriberList.length > 0) {
    const subscriber = subscriberList.shift()
    subscriber.destroy()
  }
}

// Global Event handlers.
window.addEventListener('pagehide', shutdown)
window.addEventListener('beforeunload', shutdown)

// Intro specifics.
const introContainer = document.querySelector('#intro')
const introSubmit = document.querySelector('#intro-submit')
if (intro) {
  introContainer.classList.remove('hidden')
  introSubmit.addEventListener('click', () => {
    introContainer.classList.add('hidden')
  })
}

// Start the application.
start()
