should = require('should');
sinon = require('sinon');
net = require('net');

IwyMaster = require('../../iwy_master');

describe('#connect', function() {
  var iwyMaster = null,
    socketStub = null,
    socketConnectStub = null,
    socketEmitterStub = null,
    socketWriteStub = null;

  var DEVICE_RESPONSE_WHITE_MODE_ON = new Buffer([0x66, 0x14, 0x23, 0x41, 0x21, 0x16, 0x00, 0x00, 0x00, 0xFF, 0x01, 0x99]),
    DEVICE_RESPONSE_WHITE_MODE_OFF = new Buffer([0x66, 0x14, 0x24, 0x41, 0x21, 0x16, 0x00, 0x00, 0x00, 0xFF, 0x01, 0x99]),
    DEVICE_RESPONSE_COLOR_MODE_ON = new Buffer([0x66, 0x14, 0x23, 0x41, 0x21, 0x16, 0xFF, 0xFF, 0xFF, 0x00, 0x01, 0x99]),
    DEVICE_RESPONSE_COLOR_MODE_OFF = new Buffer([0x66, 0x14, 0x24, 0x41, 0x21, 0x16, 0xFF, 0xFF, 0xFF, 0x00, 0x01, 0x99]);


  beforeEach(function(){
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
  });

  afterEach(function() {
    socketStub.restore();
  });

  it('should create a new TCP connection to the given host and port', function() {
    socketConnectStub.yields(null);
    iwyMaster.connect('127.0.0.1', 1111)

    socketConnectStub.callCount.should.equal(1);
    socketConnectStub.firstCall.args[0].should.equal(1111);
    socketConnectStub.firstCall.args[1].should.equal('127.0.0.1');
  });

  it('should use the default port "5577" when no port is given', function() {
    socketConnectStub.yields(null);
    iwyMaster.connect('127.0.0.1')

    socketConnectStub.callCount.should.equal(1);
    socketConnectStub.firstCall.args[0].should.equal(5577);
    socketConnectStub.firstCall.args[1].should.equal('127.0.0.1');
  });

  it('should execute optional callback after light device sent state', function(done) {
    socketConnectStub.yields(null);

    iwyMaster.connect('127.0.0.1', function() {
      done();
    });
  });
});


