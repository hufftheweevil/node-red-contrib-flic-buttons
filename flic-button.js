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
var FlicClient = fliclib.FlicClient

let flicClients = {}

module.exports = function (RED) {
  function flicButton(config) {
    RED.nodes.createNode(this, config)

    function Log(...msgs) {
      config.debug && console.log(new Date(), 'flic-button', ...msgs)
    }

    this.host = config.host
    this.port = config.port

    this.address = config.address

    this.autodisconnecttime = config.autodisconnecttime

    let clientName = this.host + ':' + this.port

    this.client = flicClients[clientName]

    Log('client (' + clientName + ') from lookup: ' + this.client)

    if (this.client == null) {
      Log('Connecting to Flic Daemon at ' + clientName)
      this.client = new FlicClient(this.host, 5551)

      flicClients[clientName] = this.client

      this.client.on('ready', function () {
        Log('Connected to Flic daemon!')
      })

      this.client.on('error', function (error) {
        Log('Connection Error: ' + error)
      })

      this.client.on('close', function (hadError) {
        Log('Connection closed: hadError? ' + hadError)
      })
    }

    this.on('close', function () {
      if (flicClients[clientName]) {
        Log('closing client')

        flicClients[clientName].close()

        flicClients[clientName] = undefined
      }
    })
  }
  RED.nodes.registerType('Flic Button', flicButton)
}
