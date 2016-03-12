import { gawk, GawkUndefined } from '../src/index';

describe('undefined', () => {
	describe('gawking', () => {
		it('should gawk undefined', () => {
			const undef = gawk();
			expect(undef).to.be.an.instanceof(GawkUndefined);
			expect(undef.val).to.be.undefined;
		});

		it('should gawk explicit undefined', () => {
			const undef = gawk(undefined);
			expect(undef).to.be.an.instanceof(GawkUndefined);
			expect(undef.val).to.be.undefined;
		});
	});

	describe('constructor casting', () => {
		it('should cast non-undefined value', () => {
			expect(new GawkUndefined('foo').val).to.be.undefined;
			expect(new GawkUndefined(true).val).to.be.undefined;
			expect(new GawkUndefined(null).val).to.be.undefined;
			expect(new GawkUndefined(123).val).to.be.undefined;
			expect(new GawkUndefined(3.14).val).to.be.undefined;
			expect(new GawkUndefined(NaN).val).to.be.undefined;
			expect(new GawkUndefined(['a', 'b']).val).to.be.undefined;
			expect(new GawkUndefined({ foo: 'bar' }).val).to.be.undefined;
			expect(new GawkUndefined(function () {}).val).to.be.undefined;
		});

		it('should cast another gawk type', () => {
			expect(new GawkUndefined(gawk('foo')).val).to.be.undefined;
			expect(new GawkUndefined(gawk(true)).val).to.be.undefined;
			expect(new GawkUndefined(gawk(null)).val).to.be.undefined;
			expect(new GawkUndefined(gawk(123)).val).to.be.undefined;
			expect(new GawkUndefined(gawk(3.14)).val).to.be.undefined;
			expect(new GawkUndefined(gawk(NaN)).val).to.be.undefined;
			expect(new GawkUndefined(gawk(['a', 'b'])).val).to.be.undefined;
			expect(new GawkUndefined(gawk({ foo: 'bar' })).val).to.be.undefined;
			expect(new GawkUndefined(gawk(function () {})).val).to.be.undefined;
		});

		it('should copy another gawked undefined', () => {
			const undef = new GawkUndefined(gawk());
			expect(undef.val).to.be.undefined;
		});
	});

	describe('set casting', () => {
		it('should cast and set non-undefined value', () => {
			const undef = gawk();
			undef.val = 'foo';             expect(undef.val).to.be.undefined;
			undef.val = true;              expect(undef.val).to.be.undefined;
			undef.val = null;              expect(undef.val).to.be.undefined;
			undef.val = 123;               expect(undef.val).to.be.undefined;
			undef.val = 3.14;              expect(undef.val).to.be.undefined;
			undef.val = NaN;               expect(undef.val).to.be.undefined;
			undef.val = ['a', 'b'];        expect(undef.val).to.be.undefined;
			undef.val = { foo: 'bar' };    expect(undef.val).to.be.undefined;
			undef.val = function () {};    expect(undef.val).to.be.undefined;
		});

		it('should cast and set another gawk type', () => {
			const undef = gawk();
			undef.val = gawk('foo');             expect(undef.val).to.be.undefined;
			undef.val = gawk(true);              expect(undef.val).to.be.undefined;
			undef.val = gawk(null);              expect(undef.val).to.be.undefined;
			undef.val = gawk(123);               expect(undef.val).to.be.undefined;
			undef.val = gawk(3.14);              expect(undef.val).to.be.undefined;
			undef.val = gawk(NaN);               expect(undef.val).to.be.undefined;
			undef.val = gawk(['a', 'b']);        expect(undef.val).to.be.undefined;
			undef.val = gawk({ foo: 'bar' });    expect(undef.val).to.be.undefined;
			undef.val = gawk(function () {});    expect(undef.val).to.be.undefined;
		});

		it('should copy another gawked undefined', () => {
			const undef = gawk();
			undef.val = gawk();
			expect(undef.val).to.be.undefined;
		});
	});

	describe('built-ins', () => {
		it('should support toString()', () => {
			expect(gawk().toString()).to.equal('');
		});

		it('should support valueOf()', () => {
			expect(gawk().valueOf()).to.be.undefined;
		});
	});

	describe('notifications', () => {
		it('should not send notifications', () => {
			const undef = gawk();
			let count = 0;

			undef.watch(evt => {
				count++;
			});

			undef.val = 'bar';

			expect(count).to.equal(0);
		});
	});
});
