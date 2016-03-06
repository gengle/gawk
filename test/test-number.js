import { gawk, GawkNumber } from '../src/index';

describe('number', () => {
	it('should return zero', () => {
		const gobj = gawk(0);
		expect(gobj).to.be.an.instanceof(GawkNumber);
		expect(gobj.val).to.equal(0);
	});

	it('should return negative number', () => {
		const gobj = gawk(-1);
		expect(gobj).to.be.an.instanceof(GawkNumber);
		expect(gobj.val).to.equal(-1);
	});

	it('should return positive number', () => {
		const gobj = gawk(1);
		expect(gobj).to.be.an.instanceof(GawkNumber);
		expect(gobj.val).to.equal(1);
	});

	it('should return positive infinity', () => {
		const gobj = gawk(Infinity);
		expect(gobj).to.be.an.instanceof(GawkNumber);
		expect(gobj.val).to.equal(Infinity);
	});

	it('should return negative infinity', () => {
		const gobj = gawk(-Infinity);
		expect(gobj).to.be.an.instanceof(GawkNumber);
		expect(gobj.val).to.equal(-Infinity);
	});

	it('should return decimal', () => {
		const gobj = gawk(3.14);
		expect(gobj).to.be.an.instanceof(GawkNumber);
		expect(gobj.val).to.equal(3.14);
	});

	it('should return zero from Number object', () => {
		const gobj = gawk(new Number(0));
		expect(gobj).to.be.an.instanceof(GawkNumber);
		expect(gobj.val).to.equal(0);
	});

	it('should return positive integer from Number object', () => {
		const gobj = gawk(new Number(1));
		expect(gobj).to.be.an.instanceof(GawkNumber);
		expect(gobj.val).to.equal(1);
	});

	it('should return negative integer from Number object', () => {
		const gobj = gawk(new Number(-1));
		expect(gobj).to.be.an.instanceof(GawkNumber);
		expect(gobj.val).to.equal(-1);
	});

	it('should support toString()', () => {
		const gobj = gawk(123);
		expect(gobj.toString()).to.equal('123');
	});

	it('should support valueOf()', () => {
		const gobj = gawk(123);
		expect(gobj.valueOf()).to.equal(123);
	});
});
