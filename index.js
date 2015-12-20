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
  ON_MSG = [0xcc,  ON_VALUE, 0x33],
  OFF_MSG = [0xcc, OFF_VALUE, 0x33],
  MODE = { WHITE: 0x0F, COLOR: 0xF0},
  STATE_REQUEST_MSG = [0xef, 0x01, 0x77];

/*
  constructor
*/

function IwyMaster(host, port, device) {
  if (host === null || host === undefined) {
   throw new Error('host address requiered');
  }

  if(typeof port === 'string') {
    device = port;
    port = null;
  }

  this._host = host;
  this._port = port || DEFAULT_PORT;
  this._device = device || IwyMaster.DEVICES.IWY_MASTER;

  this._powerState = null;
  this._mode = null;
  this._brightness = null;
  this._color = Color();
}

/*
  inherit from EventEmitter
*/

util.inherits(IwyMaster, EventEmitter);

/*
  class variables
*/


IwyMaster.DEVICES = {
  IWY_MASTER: 'iwy-master',
  WIFI370: 'wifi370'
}

/*
  private methods
*/

IwyMaster.prototype._lightMsg = function() {
  if(this._device === IwyMaster.DEVICES.WIFI370){
    return new Buffer([
      0x56,
      this._color.rgb().r,
      this._color.rgb().g,
      this._color.rgb().b,
      0xAA
    ]);
  } else {
    return new Buffer([
      0x56,
      this._color.rgb().r,
      this._color.rgb().g,
      this._color.rgb().b,
      Math.round(this._brightness * 2.55, 0),
      MODE[this._mode],
      0xAA
    ]);
  }
}

IwyMaster.prototype._requestState = function(client, cb) {
  var msg = new Buffer(STATE_REQUEST_MSG);

  this.once('stateUpdated', cb);
  this.once('connTimeout', cb);

  client.write(msg, function (err) {
    if(err) cb(err);
  });
}

IwyMaster.prototype._send = function(overwriteFn, cb) {
  var self = this;

  var errorEmitter = function(err) {
    if(!err) return;
    self.emit('error', err);
  }

  var errorCb = cb || errorEmitter;

  this.once('connTimeout', errorCb);

  this._connect(function (err, client) {
    if(err) return errorCb(err);

    var currentPowerState = self._powerState;

    self._requestState(client, function() {
      overwriteFn();

      var onOff = function (cb) {
        if(currentPowerState !== self._powerState) {
          var msg = self._powerState === true ? ON_MSG : OFF_MSG;
          msg = new Buffer(msg);
          client.write(msg, function (err) {
            cb(err);
          });
        } else {
          cb();
        }
      }

      onOff(function(err) {
        if(err) {
          client.end();
          return errorCb(err, self._getStateObj());
        }

        client.write(self._lightMsg(), function (err) {
          client.end();
          errorCb(err, self._getStateObj());
        });
      });
    });
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
    this._brightness = Math.round((data[9] / 255) * 100, 0);
  }
  else {
    this._mode = COLOR;
    // in case of color mode we can just assume the brightness
    this._brightness = this._color.hsl().l
  }
  this.emit('stateUpdated');
}

IwyMaster.prototype._connect = function(cb) {
  var self = this,
    isCbExecuted = false;

  var client = new net.Socket();

  var timeoutId = setTimeout(function() {
    var err = new Error('connection timeout');
    client.destroy();

    if(!isCbExecuted) {
      cb(err);
    } else {
      self.emit('connTimeout', err);
    }
  }, 2000);

  client.on('close', function() {
    clearTimeout(timeoutId);
  });

  client.on('error', function(error) {
    client.destroy();
    isCbExecuted = true;
    cb(error);
  });

  // only used to get the current state of the device
  client.on('data', this._receiveState.bind(this));

  client.connect(this._port, this._host, function(err) {
    isCbExecuted = true;
    cb(err, client);
  });
}

/*
  public methods
*/


IwyMaster.prototype.switchOn = function(callback) {
  var overwrite = function() {
    this._powerState = true;
  }

  this._send(overwrite.bind(this), callback);
}

IwyMaster.prototype.switchOff = function(callback) {
  var overwrite = function() {
    this._powerState = false;
  }

  this._send(overwrite.bind(this), callback);
}

IwyMaster.prototype.getState = function(callback) {
  var overwrite = function() {}

  this._send(overwrite.bind(this), callback);
}

IwyMaster.prototype.setWhite = function(callback) {
  var overwrite = function() {
    this._mode = WHITE;
    this._color.rgb(255, 255, 255);
  }

  this._send(overwrite.bind(this), callback);
}

IwyMaster.prototype.setColor = function(red, green, blue, callback) {
  if(!arguments.hasOwnProperty('2') || typeof(arguments['2']) != 'number') {
    throw new Error('worng arguments');
  }

  for (key in arguments) {
    if(arguments[key] < 0 || arguments[key] > 255) {
      throw new Error('value must be between 0 and 255!');
    }
  }

  var overwrite = function() {
    this._mode = COLOR;
    this._color.rgb(red, green, blue);
  }

  this._send(overwrite.bind(this), callback);
}

IwyMaster.prototype.setBrightness = function(brightness, callback) {
  if(brightness < 0 || brightness > 100) {
    throw new Error('brightness must be a value between 0 and 100!');
  }

  var overwrite = function() {
    this._brightness = brightness;

    if(this._mode === COLOR) {
      hsl = this._color.hsl();
      hsl.l = brightness;
      this._color = this._color.hsl(hsl);
    }
  }

  this._send(overwrite.bind(this), callback);
}

module.exports = IwyMaster;
