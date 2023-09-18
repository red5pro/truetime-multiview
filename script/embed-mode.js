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
 * Utility for providing embedding options for developers to copy and paste.
 */
// import { doc } from 'prettier'
import { query, hasHostDefined } from './url-util.js'

const {
  embedMode,
  host,
  vod,
  vodBase,
  app,
  abr,
  scriptURL,
  streams: streamsQueryList,
} = query()

// TODO: VOD Base

const embedder = document.querySelector('#embedder')
const dialog = document.querySelector('#embed-dialog')
const code = dialog.querySelector('.embed-dialog_code')
const hostField = dialog.querySelector('#embed-options_host')
const appField = dialog.querySelector('#embed-options_app')
const abrCheck = dialog.querySelector('#embed-options_abr')
const abrLow = dialog.querySelector('#embed-options_abrlow')
const abrHigh = dialog.querySelector('#embed-options_abrhigh')
const vodCheck = dialog.querySelector('#embed-options_vod')
const vodBaseCheck = dialog.querySelector('#embed-options_vod_base')
const vodField = dialog.querySelector('#embed-options_vod_url')
const serviceCheck = dialog.querySelector('#embed-options_service')
const serviceField = dialog.querySelector('#embed-options_service_url')
const streamsCheck = dialog.querySelector('#embed-options_params')
const addStreamButton = dialog.querySelector('#add-stream-button')
const streamsListOptions = dialog.querySelector('#embed-options_stream-list')

const srcReg = /src="([^"]*)"/
const HOST_INSERT = 'YOUR_RED5PRO_SERVER'
const HOSTED_PROTOCOL = 'https:'
const HOSTED_PAGE = 'red5pro.github.io'
const HOSTED_PATH = 'truetime-multiview'

const getURL = () => {
  const src = srcReg.exec(code.textContent)[1]
  let url = new URL(src)
  url.searchParams.delete('demo')
  url.searchParams.delete('embed')
  return url
}

const onHostChange = (event) => {
  const host = event.target.value
  const hostAvailable = host && host.length > 0
  let url = getURL()
  if (hostAvailable) {
    url.searchParams.set('host', host)
  } else {
    url.searchParams.delete('host')
  }
  code.textContent = code.textContent.replace(srcReg, `src="${url.toString()}"`)
}

const onAppChange = (event) => {
  const app = event.target.value
  const appAvailable = app && app.length > 0
  let url = getURL()
  if (appAvailable) {
    url.searchParams.set('app', app)
  } else {
    url.searchParams.delete('app')
  }
  code.textContent = code.textContent.replace(srcReg, `src="${url.toString()}"`)
}

const onAbrChange = (event) => {
  let url = getURL()
  if (abrCheck.checked) {
    url.searchParams.set('abr', 'true')
    url.searchParams.set('abrlow', abrLow.value)
    url.searchParams.set('abrhigh', abrHigh.value)
  } else {
    url.searchParams.delete('abr')
    url.searchParams.delete('abrlow')
    url.searchParams.delete('abrhigh')
  }
  code.textContent = code.textContent.replace(srcReg, `src="${url.toString()}"`)
}

const onVODChange = (event) => {
  let url = getURL()
  if (vodCheck.checked) {
    url.searchParams.set('vod', 'true')
    code.textContent = code.textContent.replace(
      srcReg,
      `src="${url.toString()}"`
    )
  } else {
    url.searchParams.set('vod', 'false')
    code.textContent = code.textContent.replace(
      srcReg,
      `src="${url.toString()}"`
    )
  }
}

const onVODBaseChange = (event) => {
  if (vodBaseCheck.checked) {
    const vodBase = vodField.value
    const vodAvailable = vodBase && vodBase.length > 0
    let url = getURL()
    if (vodAvailable) {
      url.searchParams.set('vodbase', vodBase)
    } else {
      url.searchParams.delete('vodbase')
    }
    code.textContent = code.textContent.replace(
      srcReg,
      `src="${url.toString()}"`
    )
  } else {
    const url = getURL()
    url.searchParams.delete('vodbase')
    code.textContent = code.textContent.replace(
      srcReg,
      `src="${url.toString()}"`
    )
  }
}

const onServiceChange = (event) => {
  if (serviceCheck.checked) {
    const service = serviceField.value
    const serviceAvailable = service && service.length > 0
    let url = getURL()
    if (serviceAvailable) {
      url.searchParams.set('url', service)
    } else {
      url.searchParams.delete('url')
    }
    code.textContent = code.textContent.replace(
      srcReg,
      `src="${url.toString()}"`
    )
  } else {
    const url = getURL()
    url.searchParams.delete('url')
    code.textContent = code.textContent.replace(
      srcReg,
      `src="${url.toString()}"`
    )
  }
}

const onStreamsParamChange = (event) => {
  let url = getURL()
  if (streamsCheck.checked) {
    document.querySelectorAll('.stream-param').forEach((param) => {
      const key = param.querySelector('.stream-param_key').value
      const value = param.querySelector('.stream-param_value').value
      if (key && key.length > 0 && value && value.length > 0) {
        url.searchParams.set(decodeURIComponent(key), value)
      }
    })
  } else {
    document.querySelectorAll('.stream-param').forEach((param) => {
      const key = param.querySelector('.stream-param_key').value
      url.searchParams.delete(decodeURIComponent(key))
    })
  }
  code.textContent = code.textContent.replace(srcReg, `src="${url.toString()}"`)
}

const onStreamsKeyValueParamChange = (event) => {
  let url = getURL()
  let pair = []
  const field = event.target
  const { oldValue, value: fieldValue } = field
  const fieldValueAvailable = fieldValue && fieldValue.length > 0
  if (
    field.nextElementSibling &&
    field.nextElementSibling.tagName.toLowerCase() === 'input'
  ) {
    const { value: valueValue } = field.nextElementSibling
    if (fieldValueAvailable && valueValue && valueValue.length > 0) {
      pair = [fieldValue, valueValue]
    }
  } else if (field.previousElementSibling) {
    const { value: keyValue } = field.previousElementSibling
    if (fieldValueAvailable && keyValue && keyValue.length > 0) {
      pair = [keyValue, fieldValue]
    }
  }

  url.searchParams.delete(decodeURIComponent(oldValue))
  if (pair.length === 2) {
    url.searchParams.set(decodeURIComponent(pair[0]), pair[1])
  }
  code.textContent = code.textContent.replace(srcReg, `src="${url.toString()}"`)
}

const onAddStreamParam = (
  optionalEvent = null,
  keyValue = undefined,
  valueValue = undefined
) => {
  const param = document.createElement('div')
  param.classList.add('stream-param')
  const key = document.createElement('input')
  key.classList.add('stream-param_key')
  key.type = 'text'
  key.placeholder = 'Label'
  key.value = keyValue || ''
  const value = document.createElement('input')
  value.classList.add('stream-param_value')
  value.type = 'text'
  value.placeholder = 'Stream Name'
  value.value = valueValue || ''
  const remove = document.createElement('img')
  remove.src = 'icons/circle-xmark-solid.svg'
  remove.classList.add('stream-param_remove')
  param.appendChild(key)
  param.appendChild(value)
  param.appendChild(remove)
  streamsListOptions.appendChild(param)
  key.onfocus = function () {
    this.oldValue = this.value
  }
  value.onfocus = function () {
    this.oldValue = this.value
  }
  key.addEventListener('change', onStreamsKeyValueParamChange)
  value.addEventListener('change', onStreamsKeyValueParamChange)
  remove.addEventListener('click', onRemoveStreamParam)
}

const onRemoveStreamParam = (event) => {
  const param = event.target.parentNode
  const key = param.querySelector('.stream-param_key')
  const value = param.querySelector('.stream-param_value')
  key.removeEventListener('change', onStreamsKeyValueParamChange)
  value.removeEventListener('change', onStreamsKeyValueParamChange)
  streamsListOptions.removeChild(param)
  let url = getURL()
  url.searchParams.delete(decodeURIComponent(key.value))
  code.textContent = code.textContent.replace(srcReg, `src="${url.toString()}"`)
}

const show = (location, pathname) => {
  const url = hasHostDefined()
    ? location.replace(host, HOST_INSERT)
    : `${location}&host=${HOST_INSERT}`
  let insert = new URL(url)
  insert.searchParams.delete('demo')
  insert.searchParams.delete('embed')
  insert.pathname = pathname
  code.textContent = `<iframe src="${insert.toString()}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`

  hostField.value = new URLSearchParams(insert.search).get('host') || ''
  appField.value = app || ''
  serviceField.value = scriptURL || ''
  serviceCheck.checked = scriptURL
  abrCheck.checked = abr
  vodCheck.checked = vod
  vodBaseCheck.checked = vodBase
  vodField.value = vodBase || ''

  if (streamsQueryList) {
    streamsQueryList.forEach((stream) => {
      const { label, streamName } = stream
      onAddStreamParam(null, encodeURIComponent(label), streamName)
    })
    streamsCheck.checked = true
  }

  hostField.addEventListener('change', onHostChange)
  appField.addEventListener('change', onAppChange)
  abrCheck.addEventListener('change', onAbrChange)
  abrLow.addEventListener('change', onAbrChange)
  abrHigh.addEventListener('change', onAbrChange)
  vodCheck.addEventListener('change', onVODChange)
  vodBaseCheck.addEventListener('change', onVODBaseChange)
  vodField.addEventListener('change', onVODBaseChange)
  serviceField.addEventListener('change', onServiceChange)
  serviceCheck.addEventListener('change', onServiceChange)
  streamsCheck.addEventListener('change', onStreamsParamChange)

  addStreamButton.addEventListener('click', onAddStreamParam)

  const closeElements = dialog.querySelectorAll('.embed-dialog_close')
  closeElements.forEach((closeElement) => {
    closeElement.addEventListener('click', close)
  })
  dialog.showModal()
}

const close = async () => {
  const closeElement = dialog.querySelector('.embed-dialog_close')

  hostField.removeEventListener('change', onHostChange)
  appField.removeEventListener('change', onAppChange)
  abrCheck.removeEventListener('change', onAbrChange)
  abrLow.removeEventListener('change', onAbrChange)
  abrHigh.removeEventListener('change', onAbrChange)
  vodCheck.removeEventListener('change', onVODChange)
  vodBaseCheck.removeEventListener('change', onVODBaseChange)
  vodField.removeEventListener('change', onVODBaseChange)
  serviceCheck.removeEventListener('change', onServiceChange)
  serviceField.removeEventListener('change', onServiceChange)
  serviceField.removeEventListener('change', onServiceChange)
  streamsCheck.removeEventListener('change', onStreamsParamChange)

  addStreamButton.removeEventListener('click', () => onAddStreamParam)

  while (streamsListOptions.childNodes.length > 0) {
    streamsListOptions.removeChild(streamsListOptions.childNodes[0])
  }

  try {
    await navigator.clipboard.writeText(code.value)
    console.log(code.value)
  } catch (err) {
    console.error('Failed to copy text: ', err)
  }

  if (closeElement) {
    closeElement.removeEventListener('click', close)
  }
  dialog.close()
}

if (embedMode) {
  embedder.classList.remove('hidden')
  embedder.addEventListener('click', () => {
    const location = window.location
    const locationStr = window.location.toString()
    let url = locationStr.replace(location.protocol, HOSTED_PROTOCOL)
    url = url.replace(location.host, HOSTED_PAGE)
    show(url, HOSTED_PATH)
  })
}
