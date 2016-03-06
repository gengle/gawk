import { gawk, GawkUndefined } from '../src/index';

describe('undefined', () => {
	it('should return undefined', () => {
		const gobj = gawk();
		expect(gobj).to.be.an.instanceof(GawkUndefined);
		expect(gobj.val).to.be.undefined;
	});

	it('should support toString()', () => {
		const gobj = gawk();
		expect(gobj.toString()).to.equal('');
	});

	it('should support valueOf()', () => {
		const gobj = gawk();
		expect(gobj.valueOf()).to.be.undefined;
	});
});
