EventEmitter = require('events').EventEmitter;
net = require('net');
util = require('util');
Color = require('color');

/*
  constants
*/

var DEFAULT_PORT = 5577,
  WHITE = 'WHITE',
  COLOR = 'COLOR';

var ON_VALUE = 0x23,
  OFF_VALUE = 0x24,
  ON_MSG = [0xcc, ON_VALUE, 0x33],
  OFF_MSG = [0xcc, OFF_VALUE, 0x33],
  MODE = { WHITE: 0x0F, COLOR: 0xF0},
  STATE_REQUEST_MSG = [0xef, 0x01, 0x77];

/*
  constructor
*/

function IwyMaster() {
  this._powerState = null;
  this._mode = null;
  this._brightness = null;
  this._color = Color();

  this._tcpClient = null;
}

/*
  inherit from EventEmitter
*/

util.inherits(IwyMaster, EventEmitter);

/*
  private methods
*/

IwyMaster.prototype._lightMsg = function() {
  return [
    0x56,
    this._color.rgb().r,
    this._color.rgb().g,
    this._color.rgb().b,
    Math.round(this._brightness * 2.55),
    MODE[this._mode],
    0xAA
  ];
}

IwyMaster.prototype._requestState = function(cb) {
  var msg = new Buffer(STATE_REQUEST_MSG);
  this.once('stateUpdated', function() {
    cb();
  });
  this._tcpClient.write(msg, function (err) {
    // TODO: error handling
    if(err) cb(err);
  });
}

IwyMaster.prototype._send = function(msg, cb) {
  var self = this;
  var msg = new Buffer(msg);

  this._tcpClient.write(msg, function (err) {
    if (typeof cb === 'function') cb(err, self._getStateObj());
  });
}

IwyMaster.prototype._getStateObj = function () {
  return {
    power: this._powerState,
    mode: this._mode,
    brightness: this._brightness,
    color: this._color.rgb()
  }
}

IwyMaster.prototype._receiveState = function(data) {
  this._powerState = data[2] === ON_VALUE;
  this._color.rgb(data[6], data[7], data[8]);

  if(data[6] === 0 && data[7] === 0 && data[8] === 0) {
    this._mode = WHITE;
    // cast it in a scale between 0 and 100
    this._brightness = (data[9] / 255) * 100;
  }
  else {
    this._mode = COLOR;
    // in case of color mode we can just assume the brightness
    this._brightness = this._color.hsl().l
  }
  this.emit('stateUpdated');
}

/*
  public methods
*/

IwyMaster.prototype.connect = function(host, port, callback) {
  if (arguments.length === 1) {
    port = DEFAULT_PORT;
  }

  if (arguments.length === 2) {
    if (typeof arguments[1] === 'function') {
      callback = port;
      port = DEFAULT_PORT;
    }
  }

  client = new net.Socket();
  this._tcpClient = client;

  var self = this;

  client.on('error', function(error) {
    self.emit('error', error)
  });

  // reconnect automatically
  client.on('close', function() {
    client.connect(port, host);
  });

  // only used to get the current state of the device
  client.on('data', this._receiveState.bind(this));

  client.connect(port, host, function(err) {
    if(typeof callback === 'function') callback(err);
  });
}

IwyMaster.prototype.switchOn = function(callback) {
  var self = this;

  this._requestState(function() {
    self._powerState = true;
    self._send(ON_MSG, callback);
  });
}

IwyMaster.prototype.switchOff = function(callback) {
  var self = this;

  this._requestState(function() {
    self._powerState = false;
    self._send(OFF_MSG, callback);
  });
}

IwyMaster.prototype.getState = function(callback) {
  var self = this;

  this._requestState(function() {
    callback(null, self._getStateObj());
  });
}

IwyMaster.prototype.setWhite = function(callback) {
  var self = this;

  this._requestState(function() {
    self._mode = WHITE;
    self._color.rgb(0, 0, 0);
    self._send(self._lightMsg(), callback);
  });
}

IwyMaster.prototype.setColor = function(red, green, blue, callback) {
  var self = this;

  if(!arguments.hasOwnProperty('2') || typeof(arguments['2']) != 'number') {
    throw new Error('worng arguments');
  }

  for (key in arguments) {
    if(arguments[key] < 0 || arguments[key] > 255) {
      throw new Error('value must be between 0 and 255!');
    }
  }
  this._requestState(function() {
    self._mode = COLOR;
    self._color.rgb(red, green, blue);
    self._send(self._lightMsg(), callback);
  });
}

IwyMaster.prototype.setBrightness = function(brightness, callback) {
  var self = this;

  if(brightness < 0 || brightness > 100) {
    throw new Error('brightness must be a value between 0 and 100!');
  }
  this._requestState(function() {
    self._brightness = brightness;
    if(self._mode === COLOR) {
      hsl = self._color.hsl();
      hsl.l = brightness;
      this._color = self._color.hsl(hsl);
    }
    self._send(self._lightMsg(), callback);
  });
}

module.exports = IwyMaster;
