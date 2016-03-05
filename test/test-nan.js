import { gawk, GawkNaN } from '../src/index';

describe('NaN', () => {
	it('should return NaN', () => {
		const gobj = gawk(NaN);
		expect(gobj).to.be.an.instanceof(GawkNaN);
		expect(gobj.val()).to.be.NaN;
	});
});
