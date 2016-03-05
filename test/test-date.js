import { gawk, GawkDate } from '../src/index';

describe('date', () => {
	it('should return a date', () => {
		const date = new Date;
		const gobj = gawk(date);
		expect(gobj).to.be.an.instanceof(GawkDate);
		const val = gobj.val();
		expect(val).to.be.a.date;
		expect(val).to.equal(date);
	});
});
