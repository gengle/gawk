import { gawk, GawkUndefined } from '../src/index';

describe('undefined', () => {
	it('should return undefined', () => {
		const gobj = gawk();
		expect(gobj).to.be.an.instanceof(GawkUndefined);
		expect(gobj.val()).to.be.undefined;
	});
});
