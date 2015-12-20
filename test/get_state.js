should = require('should');
sinon = require('sinon');
net = require('net');

IwyMaster = require('../../iwy_master');

describe('#getState', function() {
  var iwyMaster = null,
    socketStub = null,
    socketConnectStub = null,
    socketEmitterStub = null,
    socketWriteStub = null,
    socketEndStub = null,
    hostAddr = '127.0.0.1';

  var DEVICE_RESPONSE_WHITE_MODE_ON = new Buffer([0x66, 0x14, 0x23, 0x41, 0x21, 0x16, 0x00, 0x00, 0x00, 0xFF, 0x01, 0x99]),
    DEVICE_RESPONSE_WHITE_MODE_OFF = new Buffer([0x66, 0x14, 0x24, 0x41, 0x21, 0x16, 0x00, 0x00, 0x00, 0xFF, 0x01, 0x99]),
    DEVICE_RESPONSE_COLOR_MODE_ON = new Buffer([0x66, 0x14, 0x23, 0x41, 0x21, 0x16, 0xFF, 0xFF, 0xFF, 0x00, 0x01, 0x99]),
    DEVICE_RESPONSE_COLOR_MODE_OFF = new Buffer([0x66, 0x14, 0x24, 0x41, 0x21, 0x16, 0xFF, 0xFF, 0xFF, 0x00, 0x01, 0x99]);

  beforeEach(function() {
    iwyMaster = new IwyMaster(hostAddr);

    socketStub = sinon.stub(net, 'Socket');
    socketConnectStub = sinon.stub().yields(null);
    socketEmitterStub = sinon.stub();
    socketEndStub = sinon.stub();
    socketWriteStub = sinon.stub().yields(null);

    socketStub.returns({
      connect:  socketConnectStub,
      on: socketEmitterStub,
      write: socketWriteStub,
      end: socketEndStub
    });
  });

  afterEach(function() {
    socketStub.restore();
  });

  it('should request the current state of the light device', function(done) {
    var STATE_REQ_MSG = new Buffer([0xef, 0x01, 0x77]);

    iwyMaster.getState(function() {
      socketWriteStub.firstCall.args[0].should.eql(STATE_REQ_MSG);

      done();
    });

    iwyMaster._receiveState(DEVICE_RESPONSE_WHITE_MODE_ON);
  });

  context('white mode, device on', function() {
    it('should yield the device state in the correct representation', function(done) {
      iwyMaster.getState(function(err, state) {
        state.should.have.property('power', true);
        state.should.have.property('mode', 'WHITE');
        state.should.have.property('brightness', 100);
        state.should.have.property('color', {r: 0, g: 0, b: 0});

        done();
      });

      iwyMaster._receiveState(DEVICE_RESPONSE_WHITE_MODE_ON);
    });
  });

  context('white mode, device off', function() {
    it('should hold the device state in the correct representation', function(done) {
      socketWriteStub.yields(null);

      iwyMaster.getState(function(err, state) {
        state.should.have.property('power', false);
        state.should.have.property('mode', 'WHITE');
        state.should.have.property('brightness', 100);
        state.should.have.property('color', {r: 0, g: 0, b: 0});

        done();
      });

      iwyMaster._receiveState(DEVICE_RESPONSE_WHITE_MODE_OFF);
    });
  });

  context('color mode, device on', function() {
    it('should hold the device state in the correct representation', function(done) {
      iwyMaster.getState(function(err, state) {
        state.should.have.property('power', true);
        state.should.have.property('mode', 'COLOR');
        state.should.have.property('brightness', 100);
        state.should.have.property('color', {r: 255, g: 255, b: 255});

        done();
      });
      iwyMaster._receiveState(DEVICE_RESPONSE_COLOR_MODE_ON);
    });
  });

  context('color mode, device off', function() {
    it('should hold the device state in the correct representation', function(done) {
      iwyMaster.getState(function(err, state) {
        state.should.have.property('power', false);
        state.should.have.property('mode', 'COLOR');
        state.should.have.property('brightness', 100);
        state.should.have.property('color', {r: 255, g: 255, b: 255});

        done();
      });
      iwyMaster._receiveState(DEVICE_RESPONSE_COLOR_MODE_OFF);
    });
  });
});

