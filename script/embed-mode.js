import { query, hasHostDefined } from './url-util'

const { embedMode, host, app, scriptURL } = query()

const embedder = document.querySelector('#embedder')
const dialog = document.querySelector('#embed-dialog')
const code = document.querySelector('.embed-dialog_code')
const hostField = dialog.querySelector('#embed-options_host')
const appField = dialog.querySelector('#embed-options_app')
const serviceCheck = dialog.querySelector('#embed-options_service')
const serviceField = dialog.querySelector('#embed-options_service_url')

const srcReg = /src="([^"]*)"/
const hostReg = /host=([^&]*)/
const appReg = /app=([^&]*)/
const serviceReg = /url=([^&]*)/
const HOST_INSERT = 'YOUR_RED5PRO_SERVER'

const getURL = () => {
  const src = srcReg.exec(code.textContent)[1]
  return new URL(src)
}

const onHostChange = (event) => {
  const host = event.target.value
  const isDefined = code.textContent.match(hostReg)
  if (isDefined) {
    code.textContent = code.textContent.replace(hostReg, `host=${host}`)
  } else {
    const url = getURL()
    url.searchParams.set('host', host)
    code.textContent = code.textContent.replace(
      srcReg,
      `src="${url.toString()}"`
    )
  }
}

const onAppChange = (event) => {
  const app = event.target.value
  const isDefined = code.textContent.match(appReg)
  if (isDefined) {
    code.textContent = code.textContent.replace(appReg, `app=${app}`)
  } else {
    const url = getURL()
    url.searchParams.set('app', app)
    code.textContent = code.textContent.replace(
      srcReg,
      `src="${url.toString()}"`
    )
  }
}

const onServiceChange = (event) => {
  if (serviceCheck.checked) {
    const service = serviceField.value
    const isDefined = code.textContent.match(serviceReg)
    if (isDefined) {
      const url = getURL()
      url.searchParams.set('url', service)
      code.textContent = code.textContent.replace(
        srcReg,
        `src="${url.toString()}"`
      )
    } else {
      const url = getURL()
      url.searchParams.set('url', service)
      code.textContent = code.textContent.replace(
        srcReg,
        `src="${url.toString()}"`
      )
    }
  } else {
    const url = getURL()
    url.searchParams.delete('url')
    code.textContent = code.textContent.replace(
      srcReg,
      `src="${url.toString()}"`
    )
  }
}

const show = () => {
  const url = hasHostDefined()
    ? window.location.href.replace(host, HOST_INSERT)
    : `${window.location.href}&host=${HOST_INSERT}`
  const insert = new URL(url)
  insert.pathname = '/embed'
  code.textContent = `<iframe src="${insert.toString()}" width="100%" height="100%" frameborder="0" allowfullscreen></iframe>`

  hostField.value = new URLSearchParams(insert.search).get('host') || ''
  appField.value = app || ''
  serviceField.value = scriptURL || ''
  serviceCheck.checked = scriptURL

  hostField.addEventListener('change', onHostChange)
  appField.addEventListener('change', onAppChange)
  serviceField.addEventListener('change', onServiceChange)
  serviceCheck.addEventListener('change', onServiceChange)

  const closeElement = dialog.querySelector('.embed-dialog_close')
  if (closeElement) {
    closeElement.addEventListener('click', close)
  }
  dialog.showModal()
}

const close = () => {
  const closeElement = dialog.querySelector('.embed-dialog_close')

  hostField.removeEventListener('change', onHostChange)
  appField.removeEventListener('change', onAppChange)
  serviceField.removeEventListener('change', onServiceChange)

  if (closeElement) {
    closeElement.removeEventListener('click', close)
  }
  dialog.close()
}

if (embedMode) {
  embedder.classList.remove('hidden')
  embedder.addEventListener('click', () => {
    show()
  })
}
