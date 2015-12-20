should = require('should');
sinon = require('sinon');
net = require('net');

IwyMaster = require('../../iwy_master');

describe('#setWhite', function() {
  var iwyMaster = null,
    socketStub = null,
    socketConnectStub = null,
    socketEmitterStub = null,
    socketWriteStub = null,
    socketEndStub = null,
    hostAddr = '127.0.0.1';

  var STATE_REQ_MSG = new Buffer([0xef, 0x01, 0x77]);
  var DEVICE_RESPONSE_WHITE_MODE = new Buffer([0x66, 0x14, 0x23, 0x41, 0x21, 0x16, 0x00, 0x00, 0x00, 0xFF, 0x01, 0x99]),
    DEVICE_RESPONSE_COLOR_MODE = new Buffer([0x66, 0x14, 0x23, 0x41, 0x21, 0x16, 0xFF, 0xFF, 0xFF, 0x00, 0x01, 0x99]),
    DEVICE_RESPONSE_COLOR_MODE_DARK = new Buffer([0x66, 0x14, 0x23, 0x41, 0x21, 0x16, 0xcc, 0xcc, 0xcc, 0x00, 0x01, 0x99]);


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

  it('should send a command to switch the light device into white mode', function() {
    iwyMaster.setWhite();

    iwyMaster._receiveState(DEVICE_RESPONSE_COLOR_MODE);

    socketWriteStub.firstCall.args[0].should.eql(STATE_REQ_MSG);
    socketWriteStub.secondCall.args[0][5].should.equal(0x0F);
  });
  it('should send a command to switch the light device into white mode and execute the optional callback', function(done) {

    iwyMaster.setWhite(function(err, state) {
      socketWriteStub.firstCall.args[0].should.eql(STATE_REQ_MSG);
      socketWriteStub.secondCall.args[0][5].should.equal(0x0F);

      state.should.have.property('power', true);
      state.should.have.property('mode', 'WHITE');
      state.should.have.property('brightness', 100);
      state.should.have.property('color', {r: 255, g: 255, b: 255});

      done();
    });

    iwyMaster._receiveState(DEVICE_RESPONSE_COLOR_MODE);
  });
  it('should adapt the current brightness', function(done) {

    iwyMaster.setWhite(function(err, state) {
      state.should.have.property('brightness', 80);
      done();
    });

    iwyMaster._receiveState(DEVICE_RESPONSE_COLOR_MODE_DARK);
  });
});
