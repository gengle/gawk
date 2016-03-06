import { gawk, GawkString } from '../src/index';

describe('string', () => {
	it('should return an empty string', () => {
		const gobj = gawk('');
		expect(gobj).to.be.an.instanceof(GawkString);
		expect(gobj.val).to.equal('');
	});

	it('should return string', () => {
		const gobj = gawk('foo');
		expect(gobj).to.be.an.instanceof(GawkString);
		expect(gobj.val).to.equal('foo');
	});

	it('should return string from String object', () => {
		const gobj = gawk(new String('bar'));
		expect(gobj).to.be.an.instanceof(GawkString);
		expect(gobj.val).to.equal('bar');
	});

	it('should support toString()', () => {
		const gobj = gawk('foo');
		expect(gobj.toString()).to.equal('foo');
	});

	it('should support valueOf()', () => {
		const gobj = gawk('foo');
		expect(gobj.valueOf()).to.equal('foo');
	});
});
