import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

global.expect = chai.expect;
global.sinon = sinon;

export const mochaHooks = {
	beforeEach() {
		this.sandbox = sinon.createSandbox();
		global.spy = this.sandbox.spy.bind(this.sandbox);
		global.stub = this.sandbox.stub.bind(this.sandbox);
	},

	afterEach() {
		delete global.spy;
		delete global.stub;
		this.sandbox.restore();
	}
};
