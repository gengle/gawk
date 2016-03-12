import { gawk, GawkNull } from '../src/index';

describe('null', () => {
	describe('gawking', () => {
		it('should gawk null', () => {
			const nil = gawk(null);
			expect(nil).to.be.an.instanceof(GawkNull);
			expect(nil.val).to.be.null;
		});

		it('should gawk explicit null', () => {
			const nil = gawk(null);
			expect(nil).to.be.an.instanceof(GawkNull);
			expect(nil.val).to.be.null;
		});
	});

	describe('constructor casting', () => {
		it('should cast non-null value', () => {
			expect(new GawkNull().val).to.be.null;
			expect(new GawkNull('foo').val).to.be.null;
			expect(new GawkNull(true).val).to.be.null;
			expect(new GawkNull(123).val).to.be.null;
			expect(new GawkNull(3.14).val).to.be.null;
			expect(new GawkNull(NaN).val).to.be.null;
			expect(new GawkNull(['a', 'b']).val).to.be.null;
			expect(new GawkNull({ foo: 'bar' }).val).to.be.null;
			expect(new GawkNull(function () {}).val).to.be.null;
		});

		it('should cast another gawk type', () => {
			expect(new GawkNull(gawk()).val).to.be.null;
			expect(new GawkNull(gawk('foo')).val).to.be.null;
			expect(new GawkNull(gawk(true)).val).to.be.null;
			expect(new GawkNull(gawk(123)).val).to.be.null;
			expect(new GawkNull(gawk(3.14)).val).to.be.null;
			expect(new GawkNull(gawk(NaN)).val).to.be.null;
			expect(new GawkNull(gawk(['a', 'b'])).val).to.be.null;
			expect(new GawkNull(gawk({ foo: 'bar' })).val).to.be.null;
			expect(new GawkNull(gawk(function () {})).val).to.be.null;
		});

		it('should copy another gawked null', () => {
			const nil = new GawkNull(gawk(null));
			expect(nil.val).to.be.null;
		});
	});

	describe('set casting', () => {
		it('should cast and set non-null value', () => {
			const nil = gawk(null);
			nil.val = undefined;         expect(nil.val).to.be.null;
			nil.val = 'foo';             expect(nil.val).to.be.null;
			nil.val = true;              expect(nil.val).to.be.null;
			nil.val = 123;               expect(nil.val).to.be.null;
			nil.val = 3.14;              expect(nil.val).to.be.null;
			nil.val = NaN;               expect(nil.val).to.be.null;
			nil.val = ['a', 'b'];        expect(nil.val).to.be.null;
			nil.val = { foo: 'bar' };    expect(nil.val).to.be.null;
			nil.val = function () {};    expect(nil.val).to.be.null;
		});

		it('should cast and set another gawk type', () => {
			const nil = gawk(null);
			nil.val = gawk();                  expect(nil.val).to.be.null;
			nil.val = gawk('foo');             expect(nil.val).to.be.null;
			nil.val = gawk(true);              expect(nil.val).to.be.null;
			nil.val = gawk(123);               expect(nil.val).to.be.null;
			nil.val = gawk(3.14);              expect(nil.val).to.be.null;
			nil.val = gawk(NaN);               expect(nil.val).to.be.null;
			nil.val = gawk(['a', 'b']);        expect(nil.val).to.be.null;
			nil.val = gawk({ foo: 'bar' });    expect(nil.val).to.be.null;
			nil.val = gawk(function () {});    expect(nil.val).to.be.null;
		});

		it('should copy another gawked null', () => {
			const nil = gawk(null);
			nil.val = gawk(null);
			expect(nil.val).to.be.null;
		});
	});

	describe('built-ins', () => {
		it('should support toString()', () => {
			expect(gawk(null).toString()).to.equal('');
		});

		it('should support valueOf()', () => {
			expect(gawk(null).valueOf()).to.be.null;
		});
	});

	describe('notifications', () => {
		it('should not send notifications', () => {
			const nil = gawk(null);
			let count = 0;

			nil.watch(evt => {
				count++;
			});

			nil.val = 'bar';

			expect(count).to.equal(0);
		});
	});
});
