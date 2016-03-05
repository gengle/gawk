import { gawk, GawkString } from '../src/index';

describe('string', () => {
	it('should return an empty string', () => {
		const gobj = gawk('');
		expect(gobj).to.be.an.instanceof(GawkString);
		expect(gobj.val()).to.equal('');
	});

	it('should return false from Boolean object', () => {
		const gobj = gawk('foo');
		expect(gobj).to.be.an.instanceof(GawkString);
		expect(gobj.val()).to.equal('foo');
	});

	it('should return false from Boolean object', () => {
		const gobj = gawk(new String('bar'));
		expect(gobj).to.be.an.instanceof(GawkString);
		expect(gobj.val()).to.equal('bar');
	});
});
