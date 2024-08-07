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
 * Utility for displaying error and warning modal dialogs
 */
const errorModal = document.getElementById('error-modal')
const warningModal = document.getElementById('warning-modal')

/**
 * Displays the Error modal dialog with the provided title and message.
 * @param {String} title
 * @param {String} message
 * @param {Boolean} fatal Flag to consider error as fatal and therefore not allow closing the modal.
 */
export const showError = (title, message, fatal = false) => {
  const titleElement = errorModal.querySelector('.error-modal_title')
  const messageElement = errorModal.querySelector('.error-modal_message')
  const closeElement = errorModal.querySelector('.error-modal_close')
  titleElement.textContent = title
  messageElement.textContent = message
  if (fatal && closeElement) {
    closeElement.classList.add('hidden')
  } else if (closeElement) {
    closeElement.addEventListener('click', closeError)
  }
  errorModal.showModal()
}

/**
 * Closes the Error modal dialog.
 */
export const closeError = () => {
  const closeElement = errorModal.querySelector('.error-modal_close')
  if (closeElement) {
    closeElement.removeEventListener('click', closeError)
  }
  errorModal.close()
}

/**
 * Displays the Warning modal dialog with the provided title and message.
 * @param {*} title
 * @param {*} message
 */
export const showWarning = (title, message) => {
  const titleElement = warningModal.querySelector('.warning-modal_title')
  const messageElement = warningModal.querySelector('.warning-modal_message')
  const closeElement = warningModal.querySelector('.warning-modal_close')
  titleElement.textContent = title
  messageElement.textContent = message
  closeElement.addEventListener('click', closeWarning)
  warningModal.showModal()
}

/**
 * Closes the Warning modal dialog.
 */
export const closeWarning = () => {
  const closeElement = warningModal.querySelector('.warning-modal_close')
  if (closeElement) {
    closeElement.removeEventListener('click', closeWarning)
  }
  warningModal.close()
}
