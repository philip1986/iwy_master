IwyMaster = require('../../iwy_master');

iwy = new IwyMaster();

// trurn on, switch the color to red
// and switch off after 10 seconds

iwy.on('error', console.log)

iwy.connect('192.168.1.15', function() {
  iwy.switchOn();
  iwy.setColorRGB(0,255,0);
  setTimeout(function() {
    iwy.switchOff()
  }, 10000);
})
