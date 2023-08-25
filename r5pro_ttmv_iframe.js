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
const baseConfig = {
  host: window.location.origin,
  app: 'live',
  abr: false,
  abrLow: 3,
  abrHigh: 1,
  debug: false,
  vodBase: undefined,
  scriptUrl: undefined,
  streamList: [], // [{ label: <string>, streamName: <string>}]
}

class TTMV {
  constructor(element, config) {
    let configuration = { ...baseConfig, ...config }
    let elementToReplace =
      typeof element === 'string' ? document.getElementById(element) : element
    if (elementToReplace && elementToReplace.parentNode) {
      let iframe = document.createElement('iframe')
      iframe.src = TTMV.generateIFrameURL(configuration)
      iframe.id = 'r5pro-ttmv-iframe'
      iframe.width = config.width || '100%'
      iframe.height = config.height || '100%'
      elementToReplace.parentNode.replaceChild(iframe, elementToReplace)
    } else {
      console.error(
        `Could not find element or parent for: ${
          elementToReplace ? elementToReplace.id : element
        }.`
      )
    }
  }

  static generateIFrameURL(config) {
    let url = new URL(config.embedHost)
    url.pathname = '/embed'
    url.searchParams.set('host', config.host)
    url.searchParams.set('app', config.app)
    url.searchParams.set('abr', config.abr)
    url.searchParams.set('abrlow', config.abrLow)
    url.searchParams.set('abrhigh', config.abrHigh)
    url.searchParams.set('vodbase', config.vodBase)
    url.searchParams.set('debug', config.debug)
    if (config.url) {
      url.searchParams.set('url', config.scriptUrl)
    } else if (config.streamList && config.streamList.length > 0) {
      config.streamList.forEach((stream) => {
        url.searchParams.set(stream.label, stream.streamName)
      })
    }
    return url.toString()
  }
}

window.R5PRO = {
  TTMV,
}
window.onR5ProReady(window.R5PRO)
