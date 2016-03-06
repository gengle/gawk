import { gawk, GawkDate } from '../src/index';

describe('date', () => {
	it('should return a date', () => {
		const date = new Date;
		const gobj = gawk(date);
		expect(gobj).to.be.an.instanceof(GawkDate);
		const val = gobj.val;
		expect(val).to.be.a.date;
		expect(val.getTime()).to.equal(date.getTime());
		expect(val.toString()).to.equal(date.toString());
	});

	// it('should support toString()', () => {
	// 	const gobj = gawk();
	// 	expect(gobj.toString()).to.equal('undefined');
	// });
	//
	// it('should support valueOf()', () => {
	// 	const gobj = gawk();
	// 	expect(gobj.valueOf()).to.be.undefined;
	// });
});
