import { gawk, GawkNull } from '../src/index';

describe('null', () => {
	it('should return null', () => {
		const gobj = gawk(null);
		expect(gobj).to.be.an.instanceof(GawkNull);
		expect(gobj.val).to.be.null;
	});

	it('should support toString()', () => {
		const gobj = gawk(null);
		expect(gobj.toString()).to.equal('');
	});

	it('should support valueOf()', () => {
		const gobj = gawk(null);
		expect(gobj.valueOf()).to.be.null;
	});
});
