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

/**
 * Utility for parsing query params.
 *
 * URL and Query Params Example:
 * https://server/?url=https://server/live/streams.jsp&host=server&app=live&CameraOne=cameraOne&CameraTwo=cameraTwo
 */

// List of query params to exclude from the stream list parsing.
const paramExclude = [
  'url',
  'host',
  'app',
  'demo',
  'debug',
  'embed',
  'sm',
  'abr',
  'abrlow',
  'abrhigh',
  'vod',
  'vodbase',
  'intro',
]

/**
 * Return flag indicating whether or not the query params include a host.
 * @returns {boolean} Whether or not the query params include a host.
 */
export const hasHostDefined = () => {
  const searchParams = new URLSearchParams(window.location.search)
  return searchParams.has('host')
}

/**
 * Utility for parsing query params.
 * The following query parameters are supported:
 * - host: The Red5 Pro Server hostname on which the live streams are located.
 * - app: The app context on the Red5 Pro Server on which the live streams are located.
 * - vod: The optional flag indicating whether or not to display the Live VOD option.
 * - url: The optional service URL that will return a list of streams to load.
 * - abr: The optional flag indicating whether or not the streams are delivered using adaptive bitrate.
 * - abrlow: The optional value indicating the lowest variant level to use for adaptive bitrate. Default is 3.
 * - abrhigh: The optional value indicating the highest variant level to use for adaptive bitrate. Default is 1.
 * - demo: The optional flag indicating whether or not to use demo mode.
 * - debug: The optional flag indicating whether or not to use debug mode.
 * - embed: The optional flag indicating whether or not to display the embedding options.
 *
 * Any other query parameters will be parsed as stream names and labels. If the `url` param is provided that takes preference over any other stream params.
 *
 * @returns {object} Object containing the query params.
 */
export const query = () => {
  const searchParams = new URLSearchParams(window.location.search)
  let streams = []
  const abrOpt = searchParams.get('abr')
  const abrLowOpt = searchParams.get('abrlow')
  const abrHighOpt = searchParams.get('abrhigh')
  const smOpt = searchParams.get('sm')
  const vodOpt = searchParams.get('vod')
  const demoOpt = searchParams.get('demo')
  const debugOpt = searchParams.get('debug')
  const embedOpt = searchParams.get('embed')
  const introOpt = searchParams.get('intro')
  let scriptURL = searchParams.get('url')
    ? decodeURIComponent(searchParams.get('url'))
    : undefined
  let host = searchParams.get('host')
    ? decodeURIComponent(searchParams.get('host'))
    : undefined
  let app = searchParams.get('app')
    ? decodeURIComponent(searchParams.get('app'))
    : undefined
  const vodBase = searchParams.get('vodbase')
    ? decodeURIComponent(searchParams.get('vodbase'))
    : undefined
  let abr = abrOpt ? abrOpt.toLowerCase() === 'true' : false
  let abrLow = abrLowOpt ? parseInt(abrLowOpt, 10) : 3
  let abrHigh = abrHighOpt ? parseInt(abrHighOpt, 10) : 1
  let streamManager = smOpt ? smOpt.toLowerCase() === 'true' : false
  let vod = vodOpt ? vodOpt.toLowerCase() === 'true' : true
  let demoMode = demoOpt ? demoOpt.toLowerCase() === 'true' : false
  let debugMode = debugOpt ? debugOpt.toLowerCase() === 'true' : false
  let embedMode = embedOpt ? embedOpt.toLowerCase() === 'true' : false
  let intro = introOpt ? introOpt.toLowerCase() === 'true' : false
  searchParams.forEach((value, key) => {
    if (paramExclude.indexOf(key) === -1) {
      streams.push({
        label: decodeURIComponent(key),
        streamName: decodeURIComponent(value),
      })
    }
  })
  return {
    scriptURL,
    host,
    app,
    vod,
    vodBase,
    abr,
    abrLow,
    abrHigh,
    streamManager,
    streams,
    demoMode,
    debugMode,
    embedMode,
    intro,
  }
}
