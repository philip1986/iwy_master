/*
  This example let the light  bink red in an inverval of one second.
  Note: It is possible to change to light color and brightness by another device or script.

*/

IwyMaster = require('../../iwy_master');

// here you should set the network address of your iwy light device
HOST = 'xxx.xxx.xxx.xxx'

light = new IwyMaster(HOST);

light.on('error', function(err) {
  console.log(err);
})


light.switchOn();
light.setColor(0,255,0);

setInterval(function (){
  light.getState(function(err, state){
    if(err) return console.log(err);
    if(state.power){
      light.switchOff();
    }
    else {
      light.switchOn();
    }
  });
}, 1000);


