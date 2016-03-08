import { gawk, GawkBoolean } from '../src/index';

describe('boolean', () => {
	it('should gawk true', () => {
		const gobj = gawk(true);
		expect(gobj).to.be.an.instanceof(GawkBoolean);
		expect(gobj.val).to.be.true;
	});

	it('should gawk true from Boolean object', () => {
		const gobj = gawk(new Boolean(true));
		expect(gobj).to.be.an.instanceof(GawkBoolean);
		expect(gobj.val).to.be.true;
	});

	it('should gawk false', () => {
		const gobj = gawk(false);
		expect(gobj).to.be.an.instanceof(GawkBoolean);
		expect(gobj.val).to.be.false;
	});

	it('should gawk false from Boolean object', () => {
		const gobj = gawk(new Boolean(false));
		expect(gobj).to.be.an.instanceof(GawkBoolean);
		expect(gobj.val).to.be.false;
	});

	it('should support toString()', () => {
		const gobj = gawk(true);
		expect(gobj.toString()).to.equal('true');
	});

	it('should support valueOf()', () => {
		const gobj = gawk(true);
		expect(gobj.valueOf()).to.be.true;
	});
});
