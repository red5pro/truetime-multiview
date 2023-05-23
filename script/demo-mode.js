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
 * Utility for showing the webapp in Demo Mode.
 */
import { query } from './url-util.js'
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
