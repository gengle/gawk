import { gawk, GawkBoolean } from '../src/index';

describe('boolean', () => {
	it('should return true', () => {
		const gobj = gawk(true);
		expect(gobj).to.be.an.instanceof(GawkBoolean);
		expect(gobj.val()).to.be.true;
	});

	it('should return true from Boolean object', () => {
		const gobj = gawk(new Boolean(true));
		expect(gobj).to.be.an.instanceof(GawkBoolean);
		expect(gobj.val()).to.be.true;
	});

	it('should return false', () => {
		const gobj = gawk(false);
		expect(gobj).to.be.an.instanceof(GawkBoolean);
		expect(gobj.val()).to.be.false;
	});

	it('should return false from Boolean object', () => {
		const gobj = gawk(new Boolean(false));
		expect(gobj).to.be.an.instanceof(GawkBoolean);
		expect(gobj.val()).to.be.false;
	});
});
