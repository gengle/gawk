import { gawk, GawkNumber } from '../src/index';

describe('number', () => {
	describe('gawking', () => {
		it('should gawk zero', () => {
			const num = gawk(0);
			expect(num).to.be.an.instanceof(GawkNumber);
			expect(num.val).to.equal(0);
		});

		it('should gawk negative number', () => {
			const num = gawk(-1);
			expect(num).to.be.an.instanceof(GawkNumber);
			expect(num.val).to.equal(-1);
		});

		it('should gawk positive number', () => {
			const num = gawk(1);
			expect(num).to.be.an.instanceof(GawkNumber);
			expect(num.val).to.equal(1);
		});

		it('should gawk positive infinity', () => {
			const num = gawk(Infinity);
			expect(num).to.be.an.instanceof(GawkNumber);
			expect(num.val).to.equal(Infinity);
		});

		it('should gawk negative infinity', () => {
			const num = gawk(-Infinity);
			expect(num).to.be.an.instanceof(GawkNumber);
			expect(num.val).to.equal(-Infinity);
		});

		it('should gawk NaN', () => {
			const num = gawk(NaN);
			expect(num).to.be.an.instanceof(GawkNumber);
			expect(num.val).to.be.NaN;
		});

		it('should gawk decimal', () => {
			const num = gawk(3.14);
			expect(num).to.be.an.instanceof(GawkNumber);
			expect(num.val).to.equal(3.14);
		});

		it('should gawk zero from Number object', () => {
			const num = gawk(new Number(0));
			expect(num).to.be.an.instanceof(GawkNumber);
			expect(num.val).to.equal(0);
		});

		it('should gawk positive integer from Number object', () => {
			const num = gawk(new Number(1));
			expect(num).to.be.an.instanceof(GawkNumber);
			expect(num.val).to.equal(1);
		});

		it('should gawk negative integer from Number object', () => {
			const num = gawk(new Number(-1));
			expect(num).to.be.an.instanceof(GawkNumber);
			expect(num.val).to.equal(-1);
		});
	});

	describe('constructor casting', () => {
		it('should cast non-number value', () => {
			expect(new GawkNumber().val).to.be.equal(0);
			expect(new GawkNumber(null).val).to.equal(0);
			expect(new GawkNumber(true).val).to.equal(1);
			expect(new GawkNumber('foo').val).to.be.NaN;
			expect(new GawkNumber('123').val).to.equal(123);
			expect(new GawkNumber(['a', 'b']).val).to.be.NaN;
			expect(new GawkNumber({ foo: 'bar' }).val).to.be.NaN;
			expect(new GawkNumber(function () {}).val).to.be.NaN;
		});

		it('should cast another gawk type', () => {
			expect(new GawkNumber(gawk()).val).to.equal(0);
			expect(new GawkNumber(gawk(null)).val).to.equal(0);
			expect(new GawkNumber(gawk(true)).val).to.equal(1);
			expect(new GawkNumber(gawk('foo')).val).to.be.NaN;
			expect(new GawkNumber(gawk('123')).val).to.equal(123);
			expect(new GawkNumber(gawk(['a', 'b'])).val).to.be.NaN;
			expect(new GawkNumber(gawk({ foo: 'bar' })).val).to.be.NaN;
			expect(new GawkNumber(gawk(function () {})).val).to.be.NaN;
		});

		it('should copy another gawked number', () => {
			const num = new GawkNumber(gawk(123));
			expect(num.val).to.equal(123);
		});

		it('should fail if parent is not a gawk object', () => {
			expect(() => {
				new GawkNumber(123, 'foo');
			}).to.throw(TypeError, 'Parent must be a gawk class');
		});
	});

	describe('set casting', () => {
		it('should cast and set non-number value', () => {
			const num = gawk(123);
			num.val = undefined;         expect(num.val).to.equal(0);
			num.val = null;              expect(num.val).to.equal(0);
			num.val = true;              expect(num.val).to.equal(1);
			num.val = 'foo';             expect(num.val).to.be.NaN;
			num.val = '123';             expect(num.val).to.equal(123);
			num.val = ['a', 'b'];        expect(num.val).to.be.NaN;
			num.val = { foo: 'bar' };    expect(num.val).to.be.NaN;
			num.val = function () {};    expect(num.val).to.be.NaN;
		});

		it('should cast and set another gawk type', () => {
			const num = gawk(123);
			num.val = gawk();                  expect(num.val).to.equal(0);
			num.val = gawk(null);              expect(num.val).to.equal(0);
			num.val = gawk(true);              expect(num.val).to.equal(1);
			num.val = gawk('foo');             expect(num.val).to.be.NaN;
			num.val = gawk('123');             expect(num.val).to.equal(123);
			num.val = gawk(['a', 'b']);        expect(num.val).to.be.NaN;
			num.val = gawk({ foo: 'bar' });    expect(num.val).to.be.NaN;
			num.val = gawk(function () {});    expect(num.val).to.be.NaN;
		});

		it('should copy another gawked number', () => {
			const num = gawk(123);
			num.val = gawk(456);
			expect(num.val).to.equal(456);
		});
	});

	describe('built-ins', () => {
		it('should support toString() with positive integer', () => {
			expect(gawk(123).toString()).to.equal('123');
		});

		it('should support toString() with NaN', () => {
			expect(gawk(NaN).toString()).to.equal('NaN');
		});

		it('should support valueOf() with positive integer', () => {
			expect(gawk(123).valueOf()).to.equal(123);
		});

		it('should support valueOf() with NaN', () => {
			expect(gawk(NaN).valueOf()).to.be.NaN;
		});
	});

	describe('notifications', () => {
		it('should be notified when value changes', () => {
			const num = gawk(123);

			num.watch(evt => {
				expect(evt.target).to.equal(num);

				const val = evt.target.val;
				expect(val).to.be.a.number;
				expect(val).to.equal(456);
			});

			num.val = 456;
		});

		it('should only notify if value is uniquely changed', () => {
			const num = gawk(123);
			let count = 0;

			num.watch(evt => {
				count++;
			});

			num.val = 456;
			expect(count).to.equal(1);

			num.val = 456;
			expect(count).to.equal(1);
		});

		it('should unwatch changes', () => {
			const num = gawk(123);
			let count = 0;

			const unwatch = num.watch(evt => {
				count++;
			});

			num.val = 234;
			num.val = 345;

			unwatch();

			num.val = 456;
			num.val = 567;

			expect(count).to.equal(2);
		});
	});
});
