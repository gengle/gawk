import { gawk, GawkNumber } from '../src/index';

describe('number', () => {
	it('should gawk zero', () => {
		const gobj = gawk(0);
		expect(gobj).to.be.an.instanceof(GawkNumber);
		expect(gobj.val).to.equal(0);
	});

	it('should gawk negative number', () => {
		const gobj = gawk(-1);
		expect(gobj).to.be.an.instanceof(GawkNumber);
		expect(gobj.val).to.equal(-1);
	});

	it('should gawk positive number', () => {
		const gobj = gawk(1);
		expect(gobj).to.be.an.instanceof(GawkNumber);
		expect(gobj.val).to.equal(1);
	});

	it('should gawk positive infinity', () => {
		const gobj = gawk(Infinity);
		expect(gobj).to.be.an.instanceof(GawkNumber);
		expect(gobj.val).to.equal(Infinity);
	});

	it('should gawk negative infinity', () => {
		const gobj = gawk(-Infinity);
		expect(gobj).to.be.an.instanceof(GawkNumber);
		expect(gobj.val).to.equal(-Infinity);
	});

	it('should gawk NaN', () => {
		const gobj = gawk(NaN);
		expect(gobj).to.be.an.instanceof(GawkNumber);
		expect(gobj.val).to.be.NaN;
	});

	it('should gawk decimal', () => {
		const gobj = gawk(3.14);
		expect(gobj).to.be.an.instanceof(GawkNumber);
		expect(gobj.val).to.equal(3.14);
	});

	it('should gawk zero from Number object', () => {
		const gobj = gawk(new Number(0));
		expect(gobj).to.be.an.instanceof(GawkNumber);
		expect(gobj.val).to.equal(0);
	});

	it('should gawk positive integer from Number object', () => {
		const gobj = gawk(new Number(1));
		expect(gobj).to.be.an.instanceof(GawkNumber);
		expect(gobj.val).to.equal(1);
	});

	it('should gawk negative integer from Number object', () => {
		const gobj = gawk(new Number(-1));
		expect(gobj).to.be.an.instanceof(GawkNumber);
		expect(gobj.val).to.equal(-1);
	});

	it('should be notified when value changes', () => {
		const gobj = gawk(123);

		gobj.watch(evt => {
			expect(evt.target).to.equal(gobj);

			expect(evt.value).to.be.a.number;
			expect(evt.value).to.equal(456);

			const val = evt.target.val;
			expect(val).to.be.a.number;
			expect(val).to.equal(456);
		});

		gobj.val = 456;
	});

	it('should gawk non-number arg', () => {
		const gobj = new GawkNumber(function () {});
		expect(gobj.val).to.be.NaN;
	});

	it('should fail to gawk another non-number gawked type', () => {
		const gobj = new GawkNumber(gawk('hi'));
		expect(gobj.val).to.be.NaN;
	});

	it('should fail to set non-number', () => {
		const gobj = new GawkNumber(123);
		gobj.val = function () {};
		expect(gobj.val).to.be.NaN;
	});

	it('should support toString()', () => {
		const gobj = gawk(123);
		expect(gobj.toString()).to.equal('123');
	});

	it('should support valueOf()', () => {
		const gobj = gawk(123);
		expect(gobj.valueOf()).to.equal(123);
	});

	it('should support toString() with NaN', () => {
		const gobj = gawk(NaN);
		expect(gobj.toString()).to.equal('NaN');
	});

	it('should support valueOf() with NaN', () => {
		const gobj = gawk(NaN);
		expect(gobj.valueOf()).to.be.NaN;
	});
});
