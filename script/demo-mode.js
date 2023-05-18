import { query } from './url-util'
const { demoMode } = query()

let landscape = false

const body = document.body
const flip = document.querySelector('#flip')
const app = document.querySelector('#app')
const main = document.querySelector('.main-video-container')
const secondary = document.querySelector('.secondary-video-container')

const setLandscape = () => {
  const length = app.offsetHeight
  app.style.width = `${length}px`
  app.classList.remove('app_demo_portrait')
  main.classList.remove('main-video-container_demo_portait')
  secondary.classList.remove('secondary-video-container_demo_portrait')

  app.classList.add('app_demo_landscape')
  main.classList.add('main-video-container_demo_landscape')
  secondary.classList.add('secondary-video-container_demo_landscape')
}

const setPortrait = () => {
  app.classList.remove('app_demo_landscape')
  main.classList.remove('main-video-container_demo_landscape')
  secondary.classList.remove('secondary-video-container_demo_landscape')

  app.classList.add('app_demo_portrait')
  main.classList.add('main-video-container_demo_portait')
  secondary.classList.add('secondary-video-container_demo_portrait')
}

if (demoMode) {
  body.classList.add('body_demo')
  flip.classList.add('flip_demo')
  app.classList.add('app_demo')
  main.classList.add('main-video-container_demo')
  secondary.classList.add('secondary-video-container_demo')

  flip.addEventListener('click', () => {
    landscape = !landscape
    if (landscape) {
      setLandscape()
    } else {
      setPortrait()
    }
  })

  if (landscape) {
    setLandscape()
  } else {
    setPortrait()
  }
} else {
  var link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'css/media-queries.css'
  document.head.appendChild(link)
}
