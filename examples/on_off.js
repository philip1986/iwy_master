/*
  This example let the light  bink red in an inverval of one second.
  Note: It is possible to change to light color and brightness by another device or script.

*/

IwyMaster = require('../../iwy_master');

// here you should set the network address of your iwy light device
// HOST = 'xxx.xxx.xxx.xxx'
HOST = '192.168.178.55'


light = new IwyMaster(HOST);

light.on('error', function() {
  console.log('fuck');
})

// light.setBrightness(40, console.log);

light.switchOn();

// light.switchOn(function(err){
//   console.log('hier', err);
//   light.setColor(0,255,0, function(err, state) {
//     console.log('hier2', err);
//     light.setBrightness(70, console.log);
//   });
// });


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


