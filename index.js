EventEmitter = require('events').EventEmitter;
net = require('net');
util = require('util');
Color = require('color');

/*
  constants
*/

DEFAULT_PORT = 5577;
ON_MSG = [0xcc, 0x23, 0x33];
OFF_MSG = [0xcc, 0x24, 0x33];
COLOR_MODE = 0xF0;
WHITE_MODE = 0x0F;

/*
  constructor
*/

function IwyMaster() {
  this._clients = [];
  this._mode = WHITE_MODE;
  this._brightness = 0xFF;
  this._color = Color();
}

/*
  inherit from EventEmitter
*/

util.inherits(IwyMaster, EventEmitter);

/*
  private methods
*/

IwyMaster.prototype._lightMsg = function() {
  return [0x56, this._color.rgb().r, this._color.rgb().g, this._color.rgb().b, this._brightness, this._mode, 0xAA];
}

IwyMaster.prototype._send = function(msg) {
  msg = new Buffer(msg);
  this._clients.forEach(function(client) {
    return client.write(msg);
  });
}

/*
  public methods
*/

IwyMaster.prototype.connect = function(host, port, callback) {
  if (arguments.length === 1) {
    port = DEFAULT_PORT;
  }

  if (arguments.length === 2) {
    if (typeof arguments[1] === 'function') {}
      callback = port;
      port = DEFAULT_PORT;
  }

  client = new net.Socket();
  this._clients.push(client);

  self = this;

  client.on('error', function(error) {
    self.emit('error', error)
  });

  client.on('close', function() {
    client.connect(port, host);
  });

  client.connect(port, host, function() {
    if(typeof callback === 'function') {
      callback();
    }
  });
}

// TODO: add disconnect function

IwyMaster.prototype.setWhite = function() {
  this._mode = WHITE_MODE;
  this._send(this._lightMsg());
}

IwyMaster.prototype.setColorRed = function() {
  this._mode = COLOR_MODE;
  this._color.rgb(255, 0, 0);
  this._send(this._lightMsg());
}

IwyMaster.prototype.setColorGreen = function() {
  this._mode = COLOR_MODE;
  this._color.rgb(0, 255, 0);
  this._send(this._lightMsg());
}

IwyMaster.prototype.setColorBlue = function() {
  this._mode = COLOR_MODE;
  this._color.rgb(0, 0, 255);
  this._send(this._lightMsg());
}

IwyMaster.prototype.setColorRGB = function(red, green, blue) {
  for (key in arguments) {
    if(arguments[key] < 0 || arguments[key] > 255) {
      throw new Error('value must be between 0 and 255!');
    }
  }

  this._mode = COLOR_MODE;
  this._color.rgb(red, green, blue);
  this._send(this._lightMsg());
}

IwyMaster.prototype.setBrightness = function(brightness) {
  if(brightness < 0 || brightness > 100) {
    throw new Error('brightness must be a value between 0 and 100!');
  }

  this._brightness = Math.round(brightness * 2.55);
  hsl = this._color.hsl();
  hsl.l = brightness * 0.60;
  this._color = this._color.hsl(hsl);
  this._send(this._lightMsg());
}

IwyMaster.prototype.switchOn = function() {
  this._send(ON_MSG);
}

IwyMaster.prototype.switchOff = function() {
  this._send(OFF_MSG);
}

module.exports = IwyMaster;

