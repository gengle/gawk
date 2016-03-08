import { gawk, GawkDate } from '../src/index';

describe('date', () => {
	it('should gawk a date', () => {
		const date = new Date;
		const gobj = gawk(date);
		expect(gobj).to.be.an.instanceof(GawkDate);
		const val = gobj.val;
		expect(val).to.be.a.date;
		expect(val.getTime()).to.equal(date.getTime());
		expect(val.toString()).to.equal(date.toString());
	});

	it('should support toString()', () => {
		const date = new Date;
		const gobj = gawk(date);
		expect(gobj.toString()).to.equal(date.toString());
	});

	it('should support valueOf()', () => {
		const date = new Date;
		const gobj = gawk(date);
		expect(gobj.valueOf()).to.equal(date.valueOf());
	});
});
