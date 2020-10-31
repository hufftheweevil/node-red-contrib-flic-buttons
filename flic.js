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

    function Log(...msgs) {
      config.debug && console.log(new Date(), 'flic', ...msgs)
    }

    this.topic = config.topic
    this.events = Object.keys(config)
      .filter(key => key.startsWith('event') && config[key])
      .map(key => key.slice(5))

    this.button = RED.nodes.getNode(config.button)

    let client = this.button.client

    let node = this

    node.status({ fill: 'green', shape: 'ring', text: 'Connecting...' })

    function listenToButton() {
      let cc = new FlicConnectionChannel(node.button.address, {
        autoDisconnectTime: node.button.autodisconnecttime
      })
      client.addConnectionChannel(cc)

      Log(`CC created to button: ${node.button.address}`)

      cc.on('buttonUpOrDown', handleEvent)
      cc.on('buttonClickOrHold', handleEvent)
      cc.on('buttonSingleOrDoubleClickOrHold', (clickType, ...rest) => {
        // Must ignore ButtonHold clickTypes here, otherwise will trigger twice
        // And cannot use 'buttonSingleOrDoubleClick' event because then holds
        // are treated as single clicks.
        if (clickType === 'ButtonHold') return
        handleEvent(clickType, ...rest)
      })

      function handleEvent(clickType, wasQueued, timeDiff) {
        Log(
          node.button.address,
          clickType,
          wasQueued ? 'wasQueued ' + timeDiff + ' seconds ago' : ''
        )

        if (timeDiff > 5) {
          Log(`Discarding event ${clickType} because it was too old (${timeDiff} sec)`)
          return
        }

        let eventIndex = node.events.indexOf(clickType)
        if (eventIndex === -1) {
          Log('Discarding clicktype: ' + clickType + ' for topic ' + node.topic)
          return
        }

        Log('emitting ' + clickType + ' message for topic ' + node.topic)

        var msg = {
          topic: node.topic || node.button.name || node.button.address,
          payload: {
            address: node.button.address,
            clickType: clickType,
            queued: wasQueued,
            timeDiff: timeDiff
          }
        }

        node.status({ fill: 'green', shape: 'dot', text: `${clickType.slice(6)} | ${now()}` })

        if (config.outputMode == 'individual') {
          let msgs = []
          msgs[eventIndex] = msg
          node.send(msgs)
        } else {
          node.send(msg)
        }
      }

      cc.on('createResponse', function (error, connectionStatus) {
        Log(`CC createResponse for ${node.button.address}: ${error}: ${connectionStatus}`)
      })

      cc.on('removed', function (removedReason) {
        Log(`CC removed for ${node.button.address}: ${removedReason}`)
      })

      cc.on('connectionStatusChanged', function (connectionStatus, disconnectReason) {
        Log(
          `CC connectionStatusChanged for ${node.button.address}: ${connectionStatus}: ${disconnectReason}`
        )
      })
    }

    client.once('ready', function () {
      listenToButton()
    })

    client.on('ready', function () {
      node.status({ fill: 'green', shape: 'dot', text: 'connected' })
    })

    client.on('error', function (error) {
      node.error(error)
    })

    client.on('close', function (hadError) {
      node.status({
        fill: 'red',
        shape: hadError ? 'dot' : 'ring',
        text: `Connection Closed ${hadError ? '(Error)' : ''}`
      })
    })
  }
  RED.nodes.registerType('flic', flic)
}
