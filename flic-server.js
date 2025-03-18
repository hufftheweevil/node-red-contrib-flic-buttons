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

let inst = 0

module.exports = function (RED) {
  function flicServer(config) {
    RED.nodes.createNode(this, config)

    this.host = config.host
    this.port = config.port

    const clientName = `[${this.host}:${this.port}]`

    function Log(...msgs) {
      config.debug && console.log(new Date(), 'flic-server', clientName, ...msgs)
    }

    const thisinst = inst++
    Log('Connecting', thisinst)
    const client = new FlicClient(this.host, this.port)
    this.client = client // For use by `flic` nodes

    this.isReady = false

    client.on('ready', isReconnect => {
      if (isReconnect) this.warn('Successfully reconnected')
      Log('Connected', thisinst)
      this.isReady = true
    })

    client.on('error', error => {
      Log('Connection', error)

      let errMsg = error.message
      if (error.errors) errMsg += `\n${error.errors.join('\n')}`

      this.error(errMsg)
    })

    client.on('close', hadError => {
      Log('Connection closed', hadError ? '(ERROR)' : '')
      this.isReady = false
    })

    this.on('close', () => {
      Log('Closing client', thisinst)

      client.destroy()
    })
  }
  RED.nodes.registerType('Flic Server', flicServer)
}
