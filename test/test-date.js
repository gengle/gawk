import { gawk, GawkDate } from '../src/index';

describe('date', () => {
	describe('gawking', () => {
		it('should gawk a date', () => {
			const date = new Date;
			const gobj = gawk(date);
			expect(gobj).to.be.an.instanceof(GawkDate);
			const val = gobj.val;
			expect(val).to.be.a.date;
			expect(val.getTime()).to.equal(date.getTime());
			expect(val.toString()).to.equal(date.toString());
		});
	});

	describe('constructor casting', () => {
		it('should throw TypeError for non-date value', () => {
			expect(() => new GawkDate(null)).to.throw(TypeError);
			expect(() => new GawkDate(true)).to.throw(TypeError);
			expect(() => new GawkDate('foo')).to.throw(TypeError);
			expect(() => new GawkDate(123)).to.throw(TypeError);
			expect(() => new GawkDate(3.14)).to.throw(TypeError);
			expect(() => new GawkDate(NaN)).to.throw(TypeError);
			expect(() => new GawkDate(['a', 'b'])).to.throw(TypeError);
			expect(() => new GawkDate({ foo: 'bar' })).to.throw(TypeError);
			expect(() => new GawkDate(function () {})).to.throw(TypeError);
		});

		it('should throw TypeError for non-date gawk type', () => {
			expect(() => new GawkDate(gawk(null))).to.throw(TypeError);
			expect(() => new GawkDate(gawk(true))).to.throw(TypeError);
			expect(() => new GawkDate(gawk('foo'))).to.throw(TypeError);
			expect(() => new GawkDate(gawk(123))).to.throw(TypeError);
			expect(() => new GawkDate(gawk(3.14))).to.throw(TypeError);
			expect(() => new GawkDate(gawk(NaN))).to.throw(TypeError);
			expect(() => new GawkDate(gawk(['a', 'b']))).to.throw(TypeError);
			expect(() => new GawkDate(gawk({ foo: 'bar' }))).to.throw(TypeError);
			expect(() => new GawkDate(gawk(function () {}))).to.throw(TypeError);
		});

		it('should copy another gawked date', () => {
			const date = new Date;
			const gdate = new GawkDate(gawk(date));
			expect(gdate.val.getTime()).to.equal(date.getTime());
			expect(gdate.val).to.not.equal(date);
		});

		it('should create a gawk object without an explicit value', () => {
			const gobj = new GawkDate;
			expect(gobj.val).to.be.a.date;
		});
	});

	describe('set casting', () => {
		it('should throw TypeError when setting non-date value', () => {
			const date = gawk(new Date);
			expect(() => { date.val = undefined; }).to.throw(TypeError);
			expect(() => { date.val = null; }).to.throw(TypeError);
			expect(() => { date.val = true; }).to.throw(TypeError);
			expect(() => { date.val = 'foo'; }).to.throw(TypeError);
			expect(() => { date.val = 123; }).to.throw(TypeError);
			expect(() => { date.val = 3.14; }).to.throw(TypeError);
			expect(() => { date.val = NaN; }).to.throw(TypeError);
			expect(() => { date.val = ['a', 'b']; }).to.throw(TypeError);
			expect(() => { date.val = { foo: 'bar' }; }).to.throw(TypeError);
			expect(() => { date.val = function () {}; }).to.throw(TypeError);
		});

		it('should throw TypeError when setting non-date gawk type', () => {
			const date = gawk(new Date);
			expect(() => { date.val = gawk(); }).to.throw(TypeError);
			expect(() => { date.val = gawk(null); }).to.throw(TypeError);
			expect(() => { date.val = gawk(true); }).to.throw(TypeError);
			expect(() => { date.val = gawk('foo'); }).to.throw(TypeError);
			expect(() => { date.val = gawk(123); }).to.throw(TypeError);
			expect(() => { date.val = gawk(3.14); }).to.throw(TypeError);
			expect(() => { date.val = gawk(NaN); }).to.throw(TypeError);
			expect(() => { date.val = gawk(['a', 'b']); }).to.throw(TypeError);
			expect(() => { date.val = gawk({ foo: 'bar' }); }).to.throw(TypeError);
			expect(() => { date.val = gawk(function () {}); }).to.throw(TypeError);
		});

		it('should copy another gawked date', () => {
			const date = gawk(new Date);
			const now = Date.now();
			date.val = gawk(new Date(now));
			expect(date.val.getTime()).to.equal(now);
		});
	});

	describe('built-ins', () => {
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

	describe('notifications', () => {
		it('should be notified when value changes', () => {
			const date = gawk(new Date);
			const now = new Date;

			date.watch(evt => {
				expect(evt.target).to.equal(date);

				const val = evt.target.val;
				expect(val).to.be.a.date;
				expect(val).to.equal(now);
			});

			date.val = now;
		});

		it('should only notify if value is uniquely changed', () => {
			const date = gawk(new Date);
			let count = 0;

			date.watch(evt => {
				count++;
			});

			const now = Date.now() + 1e5;

			date.val = new Date(now);
			expect(count).to.equal(1);

			date.val = new Date(now);
			expect(count).to.equal(1);
		});

		it('should unwatch changes', () => {
			let now = Date.now();
			const date = gawk(new Date(now));
			let count = 0;

			const unwatch = date.watch(evt => {
				count++;
			});

			date.val = new Date(++now);
			date.val = new Date(++now);

			unwatch();

			date.val = new Date(++now);
			date.val = new Date(++now);

			expect(count).to.equal(2);
		});
	});
});
