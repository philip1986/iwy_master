# IWY Master

[Click here](http://iwy-light.de/gb/iwy-starter-sets/iwy-color-single-set-9w.html)

# Install

`npm install iwy_master`

# Usage

[Here](exampels/on_off.js) you can see a small example.

## Import and connect
```
IwyMaster = require('iwy_master');

iwy = new IwyMaster();

iwy.connect(HOST, [PORT], [CALLBACK])
```
In order to build groups, it is possible to connect to multiple light units and every command will be applied to each of them.

## Commands


`switchOn()`

*Should be obvious.*

`switchOff()`

*Should be obvious.*

`setWhite()`

*Switch the light into warm white mode.*

`setColorRGB(red, green, blue)`

*Switch the light into color mode and applies the defined color.
The values of `red`, `green` and `blue` must be btween 0 and 255.*

`setBrightness(value)`

*Set the brightness of the light in both modes. The value must be between 0 and 100. *

`setColorRed()`

*Switch the light into color mode and applies color red.*

`setColorGreen()`

*Switch the light into color mode and applies color green.*

`setColorBlue()`

*Switch the light into color mode and applies color blue().*
