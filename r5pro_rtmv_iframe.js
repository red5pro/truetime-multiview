const baseConfig = {
  host: window.location.origin,
  app: 'live',
  abr: false,
  abrLow: 3,
  abrHigh: 1,
  debug: false,
  scriptUrl: undefined,
  streamList: [], // [{ label: <string>, streamName: <string>}]
}

class RTMV {
  constructor(element, config) {
    let configuration = { ...baseConfig, ...config }
    let elementToReplace =
      typeof element === 'string' ? document.getElementById(element) : element
    if (elementToReplace && elementToReplace.parentNode) {
      let iframe = document.createElement('iframe')
      iframe.src = RTMV.generateIFrameURL(configuration)
      iframe.id = 'r5pro-rtmv-iframe'
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
  RTMV,
}
window.onR5ProReady(window.R5PRO)
