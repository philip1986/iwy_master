should = require('should');
sinon = require('sinon');
net = require('net');

IwyMaster = require('../../iwy_master');

describe('#setBrightness', function() {
  var iwyMaster = null,
    socketStub = null,
    socketConnectStub = null,
    socketEmitterStub = null,
    socketWriteStub = null,
    socketEndStub = null,
    hostAddr = '127.0.0.1';

  var STATE_REQ_MSG = new Buffer([0xef, 0x01, 0x77]);
  var DEVICE_RESPONSE_WHITE_MODE = new Buffer([0x66, 0x14, 0x23, 0x41, 0x21, 0x16, 0x00, 0x00, 0x00, 0xFF, 0x01, 0x99]),
    DEVICE_RESPONSE_COLOR_MODE = new Buffer([0x66, 0x14, 0x23, 0x41, 0x21, 0x16, 0xFF, 0xFF, 0xFF, 0x00, 0x01, 0x99]);


  beforeEach(function() {
    iwyMaster = new IwyMaster(hostAddr);
    // assume the device is switched on
    iwyMaster._powerState = true;

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

  it('should throw an error in case of wrong argument range (to high)', function() {
    (function(){iwyMaster.setBrightness(-1)}).should.throw('brightness must be a value between 0 and 100!')
  });

  it('should throw an error in case of wrong argument range (to low)', function() {
    (function(){iwyMaster.setBrightness(101)}).should.throw('brightness must be a value between 0 and 100!')
  });

  context('white mode', function() {
    it('should send a command with the given brightness', function() {
      iwyMaster.setBrightness(50);

      iwyMaster._receiveState(DEVICE_RESPONSE_WHITE_MODE);

      socketWriteStub.firstCall.args[0].should.eql(STATE_REQ_MSG);
      socketWriteStub.secondCall.args[0][4].should.equal(0x7F);
    });

    it('should send a command with the given color and execute the optional callback', function(done) {
      iwyMaster.setBrightness(50, function(err, state) {

        socketWriteStub.firstCall.args[0].should.eql(STATE_REQ_MSG);
        socketWriteStub.secondCall.args[0][4].should.equal(0x7F);

        state.should.have.property('power', true);
        state.should.have.property('mode', 'WHITE');
        state.should.have.property('brightness', 50);
        state.should.have.property('color', {r: 0, g: 0, b: 0});
        done()
      });
      iwyMaster._receiveState(DEVICE_RESPONSE_WHITE_MODE);
    });
  });

  context('color mode', function() {
    it('should adjust the color to the given brightness and send a command', function() {
      iwyMaster.setBrightness(50);

      iwyMaster._receiveState(DEVICE_RESPONSE_COLOR_MODE);

      socketWriteStub.firstCall.args[0].should.eql(STATE_REQ_MSG);
      socketWriteStub.secondCall.args[0].slice(1,4).should.eql(new Buffer([128, 128, 128]));
    });

    it('should send a command with the given color and execute the optional callback', function(done) {
      socketWriteStub.yields(null);

      iwyMaster.setBrightness(50, function(err, state) {
        socketWriteStub.firstCall.args[0].should.eql(STATE_REQ_MSG);
        socketWriteStub.secondCall.args[0][4].should.equal(0x7F);

        state.should.have.property('power', true);
        state.should.have.property('mode', 'COLOR');
        state.should.have.property('brightness', 50);
        state.should.have.property('color', {r: 128, g: 128, b: 128});
        done()
      });
      iwyMaster._receiveState(DEVICE_RESPONSE_COLOR_MODE);
    });
  });
});
