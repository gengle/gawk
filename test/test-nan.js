import { gawk, GawkNaN } from '../src/index';

describe('NaN', () => {
	it('should return NaN', () => {
		const gobj = gawk(NaN);
		expect(gobj).to.be.an.instanceof(GawkNaN);
		expect(gobj.val).to.be.NaN;
	});

	it('should support toString()', () => {
		const gobj = gawk(NaN);
		expect(gobj.toString()).to.equal('NaN');
	});

	it('should support valueOf()', () => {
		const gobj = gawk(NaN);
		expect(gobj.valueOf()).to.be.NaN;
	});
});
