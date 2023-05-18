import { query } from './url-util'
const { demoMode } = query()

const body = document.body
const flip = document.querySelector('#flip')
const app = document.querySelector('#app')
const main = document.querySelector('.main-video-container')
const secondary = document.querySelector('.secondary-video-container')
if (demoMode) {
  body.classList.add('body_demo')
  flip.classList.add('flip_demo')
  app.classList.add('app_demo')
  main.classList.add('main-video-container_demo')
  secondary.classList.add('secondary-video-container_demo')
  flip.addEventListener('click', () => {
    console.log('FLIP')
  })
} else {
  var link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = 'css/media-queries.css'
  document.head.appendChild(link)
}
