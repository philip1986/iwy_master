# IWY Master

The [IWY Master light] (http://iwy-light.de/gb/iwy-starter-sets/iwy-color-single-set-9w.html) can be controlled via WIFI. The manufacturer provides apps for Android and iOS which allows to:
 - switch on and off
 - change color
 - change brightness

This node module can be used to control the light device from any computing unit which is able to run Node.js or IO.js (e.g. a Raspberry Pi).

# Install

`npm install iwy_master`

# Usage

[Here](examples/on_off.js) you can find a 'Hello Word' example.

## Import and connect
```
IwyMaster = require('iwy_master');

iwy = new IwyMaster();

iwy.connect(HOST, [PORT], [CALLBACK])
```
You should know the IP of your light device, if not use an IP scanner and figure it out. The port and callbak are optional. If you dont set a port it will take the default one (5577), which should be fine for almost every case.
Use the callback to be sure that the connection is established.

## Commands
All commands can be called with an optional. This callback will yield an possible error and the device state after the change. E.g:
```
command(function(err, state) {...});
```
The state object will look like:
```
    power: true|false,
    mode: 'WHITE'|'COLOR',
    brightness: between 0 and 100,
    color: {
        r: between 0 and 255,
        g: between 0 and 255,
        b: between 0 and 255
    }
```

`switchOn([callback])`

*Should be obvious.*

`switchOff([callback])`

*Should be obvious.*

`setWhite([callback])`

*Switchs the light dievice into warm white mode.*

`setColor(red, green, blue, [callback])`

*Switchs the light dievice into color mode and applies the defined color.
The parameter `red`, `green` and `blue` must be set and btween 0 and 255.*

`setBrightness(value, [callback])`

*Set the brightness of the light in both modes. The value must be between 0 and 100.
__Note:__ In color mode the color itself will be adjust to a lighter or darker version of it.*
