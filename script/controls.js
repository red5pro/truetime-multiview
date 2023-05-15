const formatTime = (value) => {
  let hrs = 0
  let mins = value === 0 || isNaN(value) ? 0 : parseInt(value / 60)
  let secs = 0
  if (mins >= 60) {
    hrs = parseInt(mins / 60)
    mins = mins % 60
  }
  secs = value === 0 || isNaN(value) ? 0 : parseInt(value % 60)

  let formattedArr = hrs < 10 ? ['0' + hrs] : [hrs]
  formattedArr.push(mins < 10 ? ['0' + mins] : [mins])
  formattedArr.push(secs < 10 ? ['0' + secs] : [secs])
  return formattedArr.join(':')
}

class CustomControls {
  constructor(subscriber, player) {
    this.subscriber = subscriber
    // this.player = player

    this._isPlaying = false
    this._isMuted = false
    this._volumeValue = this._isMuted ? 0 : 1

    this._isScrubbing = false
    this._isScrubbingResumePlay = false

    this.playPauseButton = document.querySelector('#r5-play-pause-button')
    this.muteUnmuteButton = document.querySelector('#r5-mute-unmute-button')
    this.timeDisplay = document.querySelector('#r5-time-display')
    this.scrubber = document.querySelector('#r5-scrubber')
    this.onplayback = this.onPlaybackEvent.bind(this)

    this.subscriber.on('*', this.onplayback)
    // this.player.ondurationchange = event => this.onDurationChange(event)

    this.playPauseButton.addEventListener('click', (event) =>
      this.onPlayPause(event)
    )
    this.muteUnmuteButton.addEventListener('click', (event) =>
      this.onMuteUnmute(event)
    )

    this.scrubber.addEventListener('mousedown', (event) =>
      this.onScrubberStart(event)
    )
    this.scrubber.addEventListener('mouseup', (event) =>
      this.onScrubberEnd(event)
    )
    this.scrubber.addEventListener('change', (event) =>
      this.onScrubberChange(event)
    )
  }

  resetSubscriberTarget(subscriber) {
    if (this.subscriber) {
      this.subscriber.off('*'.this.onplayback)
    }
    this.subscriber = subscriber
    this.subscriber.on('*', this.onplayback)
  }

  setPlayPauseButtonState(isPlaying, withAction = false) {
    this._isPlaying = isPlaying
    this.playPauseButton.innerHTML = isPlaying ? 'Pause' : 'Play'
    if (withAction) {
      if (this._isPlaying) {
        this.subscriber.play(true)
      } else {
        this.subscriber.pause(true, true)
      }
    }
  }

  setMuteUnmuteButtonState(isMuted, withAction = false) {
    this._isMuted = isMuted
    this.muteUnmuteButton.innerHTML = isMuted ? 'Unmute' : 'Mute'
    if (withAction) {
      this._volumeValue = isMuted ? 0 : 1
      this.subscriber.setVolume(isMuted ? 0 : 1)
    }
  }

  setScrubberState(isScrubbing) {
    this._isScrubbing = isScrubbing
  }

  onPlaybackEvent(event) {
    const { type, data } = event
    if (type === 'Subscribe.Playback.Change') {
      const { code, state } = data
      if (state === 'Playback.AVAILABLE') {
        return
      }
      this.setPlayPauseButtonState(state === 'Playback.PLAYING')
    } else if (type === 'Subscribe.Volume.Change') {
      const { volume } = data
      this._volumeValue = volume
      this.setMuteUnmuteButtonState(volume === 0)
    } else if (type === 'Subscribe.Time.Update') {
      const { time, duration } = data
      this.timeDisplay.innerHTML = formatTime(time)
      this.scrubber.max = duration
      this.scrubber.value = time
    }
  }

  // onDurationChange (event) {
  //   const element = event.target
  //   const duration = element.duration
  // }

  onPlayPause(event) {
    const element = event.target
    this.setPlayPauseButtonState(!this._isPlaying, true)
  }

  onMuteUnmute(event) {
    const element = event.target
    this.setMuteUnmuteButtonState(!this._isMuted, true)
  }

  onFullscreen(event) {
    this.setFullscreenButtonState(!this._isFullscreen, true)
  }

  onScrubberStart(event) {
    this._isScrubbingResumePlay = this._isPlaying
    this.setPlayPauseButtonState(false, true)
    this.setScrubberState(true)
  }

  onScrubberChange(event) {
    const element = event.target
    const time = element.value
    const max = element.max
    console.log('[r5] onScrubberChange', time, max)
    // 6 is roughly a TS segment length. If slop is less than that, we're probably at the end of the stream.
    const perc = max - time > 6 ? time / max : 1
    this.subscriber.seekTo(perc, max)
  }

  onScrubberEnd(event) {
    console.log('[r5] onScrubberEnd. resume?', this._isScrubbingResumePlay)
    if (this._isScrubbingResumePlay) {
      this.setPlayPauseButtonState(true, true)
    }
    this._isScrubbingResumePlay = false
    this.setScrubberState(false)
  }

  getVolume() {
    return this._volumeValue
  }
}

export default CustomControls
