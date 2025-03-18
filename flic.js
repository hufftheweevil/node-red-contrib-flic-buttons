/**
 * Copyright 2015-2016 Benjamin Hardill
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
'use strict'
var fliclib = require('./lib/fliclibNodeJs')
var FlicConnectionChannel = fliclib.FlicConnectionChannel

let p = n => ('' + n).padStart(2, '0')
let now = (d = new Date()) =>
  `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`

module.exports = function (RED) {
  function flic(config) {
    RED.nodes.createNode(this, config)

    const button = RED.nodes.getNode(config.button)

    function Log(...msgs) {
      config.debug && console.log(new Date(), 'flic', `[${button.address}]`, ...msgs)
    }

    this.topic = config.topic
    this.events = Object.keys(config)
      .filter(key => key.startsWith('event') && config[key])
      .map(key => key.slice(5))

    const { client, isReady } = RED.nodes.getNode(config.server) ?? {}

    if (!client) {
      this.error('Client not set')
      this.status(STATUS.NO_CLIENT)
      return
    }

    const listenToButton = () => {
      this.status(STATUS.CONNECTING)

      let cc = new FlicConnectionChannel(button.address, {
        autoDisconnectTime: button.autodisconnecttime
      })
      client.addConnectionChannel(cc)

      Log(`Channel created`)

      const handleEvent = (clickType, wasQueued, timeDiff) => {
        if (timeDiff > 5) {
          Log(`Discarding <${clickType}> because it was too old (${timeDiff} sec)`)
          return
        }

        let eventIndex = this.events.indexOf(clickType)
        if (eventIndex === -1) {
          Log(`Discarding <${clickType}> because not enabled`)
          return
        }

        Log(`Emitting <${clickType}> with topic "${this.topic}"`)

        var msg = {
          topic: this.topic || button.name || button.address,
          payload: {
            address: button.address,
            clickType: clickType,
            queued: wasQueued,
            timeDiff: timeDiff
          }
        }

        this.status({ fill: 'green', shape: 'dot', text: `${clickType.slice(6)} | ${now()}` })

        if (config.outputMode == 'individual') {
          let msgs = []
          msgs[eventIndex] = msg
          this.send(msgs)
        } else {
          this.send(msg)
        }
      }

      cc.on('buttonUpOrDown', handleEvent)
      cc.on('buttonClickOrHold', handleEvent)
      cc.on('buttonSingleOrDoubleClickOrHold', (clickType, ...rest) => {
        // Must ignore ButtonHold clickTypes here, otherwise will trigger twice
        // And cannot use 'buttonSingleOrDoubleClick' event because then holds
        // are treated as single clicks.
        if (clickType === 'ButtonHold') return
        handleEvent(clickType, ...rest)
      })

      this.status(STATUS.CONNECTED)

      cc.on('removed', removedReason => {
        Log(`Channel removed. Reason: ${removedReason}`)
      })

      this.on('close', () => {
        cc.removeAllListeners()
        cc.close()
        Log(`Channel closed`)
      })
    }

    if (isReady) {
      listenToButton()
    } else {
      this.status(STATUS.WAITING)

      client.once('ready', listenToButton)
    }

    client.on('ready', isReconnect => {
      if (isReconnect) this.status(STATUS.CONNECTED)
    })

    client.on('close', hadError => {
      this.status({
        fill: 'red',
        shape: hadError ? 'dot' : 'ring',
        text: 'Connection Lost'
      })
    })
  }

  RED.nodes.registerType('flic', flic)
}

const STATUS = {
  NO_CLIENT: { fill: 'red', shape: 'ring', text: 'Client not found' },
  WAITING: { fill: 'green', shape: 'ring', text: 'Waiting for client...' },
  CONNECTING: { fill: 'green', shape: 'ring', text: 'Connecting...' },
  CONNECTED: { fill: 'green', shape: 'dot', text: 'Connected' }
}
