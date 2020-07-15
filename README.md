# node-red-contrib-flic-buttons

A Node-RED node to interact with the [flic.io][1] BLE buttons. Originally created by [hardilib][3], this is actually a fork from [osos's version][2], which added an option for auto-disconnect timeout to save battery life in the Flic buttons.

This fork includes two major upgrades:

- Auto-reconnect to the server. If your flicd server restarts, the node will reconnect and reattach all connection channels, without missing a beat.
- Multiple events can be triggered from one node.

See [change log](CHANGELOG.md) for full details.

## Installing Flic Daemon

This node requires the [fliclib-linux-hci][4] daemon to handle the low level comunication with the buttons. You will need to install this before you start:

```
git clone https://github.com/50ButtonsEach/fliclib-linux-hci.git
```

you can either start the daemon manually:

```
cd bin/armv6l/
sudo ./flicd -f flic.sqlite3
```

or you can edit /etc/rc.local to start the daemon on boot:

```
sudo nano /etc/rc.local
```

Add the following line just before the exit 0:

```
sleep 10 &&  /home/pi/git/fliclib-linux-hci/bin/armv6l/./flicd -d -l /var/log/flic.log  -f /home/pi/git/fliclib-linux-hci/bin/armv6l/flic.sqlite3 &

```

(obviously change the paths to match where you have installed)

## Pairing Buttons

Buttons need to be paired before you can use this node at the moment. We do this using the scanwizard.js located in the lib folder.

- Ensure that the `daemon` are running
- Ensure that any phones or other devices that your flic buttons were previously paired with are switched off or have bluetooth disabled
- navigate to `node-red-contrib-flic-buttons/lib`
- type the command `node scanwizard.js`
- press your flic button
- If it has previously been paired to another device you will have to hold the flic button down for 7 seconds to put it into public mode
- once paired take a note of the bluetooth address
- repeat this for all your flic button noting down the address for each button

## Adding Buttons to Node-Red

Each flic node requires you specify a button and at least one click type. The button is configured with a configuration node that can be shared amounst multiple flic nodes.

The button config node takes the following parameters:

- Host - this is the host running the flic.io daemon process, defaults to localhost
- Port - the port for the daemon process, defaults to 5551
- Button Address - the bluetooth address that you noted down when pairing your buttons

The node emits a `msg.payload` that looks like this

```
{
  "deviceId":"80:E4:DA:70:XX:XX",
  "queued":true,
  "timeDiff":0,
  "clickType":"ButtonDown"
}
```

ClickType can be:

- `ButtonDown` - triggered as soon as the button is pressed, regardless of single, double, or hold. (Note: will trigger twice during a double click operation)
- `ButtonUp` - triggered as soon as the button is released, regardless of single, double, or hold. (Note: will trigger twice during a double click operation)
- `ButtonClick` - triggered after the button is released and was held for at most 1 second
- `ButtonSingleClick` - triggered after the button is clicked once
- `ButtonDoubleClick` - triggered after the button is clicked twice (time between clicks is at most 0.5 seconds)
- `ButtonHold` - triggered immediately once the button is held for at least 1 second

[1]: https://flic.io/?r=985093
[2]: https://github.com/osos/node-red-contrib-flic-buttons
[3]: https://github.com/hardillb/node-red-contrib-flic-buttons
[4]: https://github.com/50ButtonsEach/fliclib-linux-hci
