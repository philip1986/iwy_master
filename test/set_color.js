should = require('should');
sinon = require('sinon');
net = require('net');

IwyMaster = require('../../iwy_master');

describe('#setColor', function() {
  var iwyMaster = null,
    socketStub = null,
    socketConnectStub = null,
    socketEmitterStub = null,
    socketWriteStub = null,
    socketEndStub = null,
    hostAddr = '127.0.0.1';

  var STATE_REQ_MSG = new Buffer([0xef, 0x01, 0x77]);
  var DEVICE_RESPONSE = new Buffer([0x66, 0x14, 0x23, 0x41, 0x21, 0x16, 0x00, 0x00, 0x00, 0xFF, 0x01, 0x99]);

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

  it('should throw an error in case of no arguments', function() {
    (function(){iwyMaster.setColor();}).should.throw('worng arguments')
  });

  it('should throw an error in case of wrong number of arguments', function() {
    (function(){iwyMaster.setColor(50, 30);}).should.throw('worng arguments')
  });

  it('should throw an error in case of wrong number of arguments (with optional callback)', function() {
    (function(){iwyMaster.setColor(50, 30, function(){});}).should.throw('worng arguments')
  });

  it('should throw an error in case of wrong argument range (to high)', function() {
    (function(){iwyMaster.setColor(50, 30, 300)}).should.throw('value must be between 0 and 255!')
  });
  it('should throw an error in case of wrong argument range (to low)', function() {
    (function(){iwyMaster.setColor(-50, 30, 30)}).should.throw('value must be between 0 and 255!')
  });

  it('should send a command with the given color', function() {
    iwyMaster.setColor(50, 51, 52);

    iwyMaster._receiveState(DEVICE_RESPONSE);

    socketWriteStub.firstCall.args[0].should.eql(STATE_REQ_MSG);
    socketWriteStub.secondCall.args[0].slice(1,4).should.eql(new Buffer([50, 51, 52]));
  });

  it('should switch to color mode', function() {
    iwyMaster.setColor(50, 51, 52);

    iwyMaster._receiveState(DEVICE_RESPONSE);
    socketWriteStub.secondCall.args[0][5].should.eql(0xF0);
  });

  it('should send a command with the given color and execute the optional callback', function(done) {
    iwyMaster.setColor(50, 51, 52, function(err, state) {
      socketWriteStub.firstCall.args[0].should.eql(STATE_REQ_MSG);
      socketWriteStub.secondCall.args[0].slice(1,4).should.eql(new Buffer([50, 51, 52]));

      state.should.have.property('power', true);
      state.should.have.property('mode', 'COLOR');
      state.should.have.property('brightness', 100);
      state.should.have.property('color', {r: 50, g: 51, b: 52});
      done()
    });
    iwyMaster._receiveState(DEVICE_RESPONSE);
  });
});
