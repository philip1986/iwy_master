should = require('should');
sinon = require('sinon');
net = require('net');

IwyMaster = require('../../iwy_master');

describe('#switch(On|Off)', function() {
  var iwyMaster = null,
    socketStub = null,
    socketConnectStub = null,
    socketEmitterStub = null,
    socketWriteStub = null;

  var ON_MSG = [0xcc, 0x23, 0x33],
    OFF_MSG = [0xcc, 0x24, 0x33],
    STATE_REQ_MSG = [0xef, 0x01, 0x77];

  var DEVICE_RESPONSE = new Buffer([0x66, 0x14, 0x23, 0x41, 0x21, 0x16, 0x00, 0x00, 0x00, 0xFF, 0x01, 0x99]);

  beforeEach(function() {
    iwyMaster = new IwyMaster();

    socketStub = sinon.stub(net, 'Socket');
    socketConnectStub = sinon.stub()
    socketEmitterStub = sinon.stub()
    socketWriteStub = sinon.stub()

    socketStub.returns({
      connect:  socketConnectStub,
      on: socketEmitterStub,
      write: socketWriteStub
    });
    iwyMaster.connect();
  });

  afterEach(function() {
    socketStub.restore();
  });

  it('should send a "ON" message to light device', function() {
    iwyMaster.switchOn()
    iwyMaster._receiveState(DEVICE_RESPONSE);

    socketWriteStub.firstCall.args[0].toJSON().should.eql(STATE_REQ_MSG);
    socketWriteStub.secondCall.args[0].toJSON().should.eql(ON_MSG);


  });

  it('should send a "ON" message to light device and execute the optional callback', function(done) {
    socketWriteStub.yields(null);

    iwyMaster.switchOn(function(err, state) {
      socketWriteStub.firstCall.args[0].toJSON().should.eql(STATE_REQ_MSG);
      socketWriteStub.secondCall.args[0].toJSON().should.eql(ON_MSG);

      state.should.have.property('power', true);
      state.should.have.property('mode', 'WHITE');
      state.should.have.property('brightness', 100);
      state.should.have.property('color', {r: 0, g: 0, b: 0});

      done();
    });
    iwyMaster._receiveState(DEVICE_RESPONSE);
  });

  it('should send a "OFF" message to light device', function() {
    iwyMaster.switchOff()
    iwyMaster._receiveState(DEVICE_RESPONSE);

    socketWriteStub.firstCall.args[0].toJSON().should.eql(STATE_REQ_MSG);
    socketWriteStub.secondCall.args[0].toJSON().should.eql(OFF_MSG);
  });

  it('should send a "OFF" message to light device and execute the optional callback', function(done) {
    socketWriteStub.yields(null);

    iwyMaster.switchOff(function(err, state) {
      socketWriteStub.firstCall.args[0].toJSON().should.eql(STATE_REQ_MSG);
      socketWriteStub.secondCall.args[0].toJSON().should.eql(OFF_MSG);

      state.should.have.property('power', false);
      state.should.have.property('mode', 'WHITE');
      state.should.have.property('brightness', 100);
      state.should.have.property('color', {r: 0, g: 0, b: 0});

      done();
    });
    iwyMaster._receiveState(DEVICE_RESPONSE);
  });

});
