/*
  This example let the light  bink red in an inverval of one second.
  Note: It is possible to change to light color and brightness by another device or script.

*/

IwyMaster = require('../../iwy_master');

light = new IwyMaster();

// here you should set the network address of your iwy light
HOST = '192.168.178.51'

light.connect(HOST, function() {
  light.switchOn();
  light.setColor(255,0,0);

  setInterval(function (){
    light.getState(function(err, state){
      if(state.power){
        light.switchOff();
      }
      else {
        light.switchOn();
      }
    });
  }, 1000);

});
