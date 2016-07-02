import { gawk, GawkBoolean } from '../src/index';

describe('boolean', () => {
	describe('gawking', () => {
		it('should gawk true', () => {
			const bool = gawk(true);
			expect(bool).to.be.an.instanceof(GawkBoolean);
			expect(bool.val).to.be.true;
		});

		it('should gawk false', () => {
			const bool = gawk(false);
			expect(bool).to.be.an.instanceof(GawkBoolean);
			expect(bool.val).to.be.false;
		});

		it('should gawk true from Boolean object', () => {
			const bool = gawk(new Boolean(true));
			expect(bool).to.be.an.instanceof(GawkBoolean);
			expect(bool.val).to.be.true;
		});

		it('should gawk false from Boolean object', () => {
			const bool = gawk(new Boolean(false));
			expect(bool).to.be.an.instanceof(GawkBoolean);
			expect(bool.val).to.be.false;
		});
	});

	describe('constructor casting', () => {
		it('should cast non-boolean value', () => {
			expect(new GawkBoolean().val).to.be.false;
			expect(new GawkBoolean(null).val).to.be.false;
			expect(new GawkBoolean('foo').val).to.be.true;
			expect(new GawkBoolean(123).val).to.be.true;
			expect(new GawkBoolean(3.14).val).to.be.true;
			expect(new GawkBoolean(NaN).val).to.be.false;
			expect(new GawkBoolean(['a', 'b']).val).to.be.true;
			expect(new GawkBoolean({ foo: 'bar' }).val).to.be.true;
			expect(new GawkBoolean(function () {}).val).to.be.true;
		});

		it('should cast another gawk type', () => {
			expect(new GawkBoolean(gawk()).val).to.be.false;
			expect(new GawkBoolean(gawk(null)).val).to.be.false;
			expect(new GawkBoolean(gawk('foo')).val).to.be.true;
			expect(new GawkBoolean(gawk(123)).val).to.be.true;
			expect(new GawkBoolean(gawk(3.14)).val).to.be.true;
			expect(new GawkBoolean(gawk(NaN)).val).to.be.false;
			expect(new GawkBoolean(gawk(['a', 'b'])).val).to.be.true;
			expect(new GawkBoolean(gawk({ foo: 'bar' })).val).to.be.true;
			expect(new GawkBoolean(gawk(function () {})).val).to.be.true;
		});

		it('should copy another gawked boolean', () => {
			const bool = new GawkBoolean(gawk(true));
			expect(bool.val).to.be.true;
		});

		it('should fail if parent is not a gawk object', () => {
			expect(() => {
				new GawkBoolean(true, 'foo');
			}).to.throw(TypeError, 'Parent must be a gawk class');
		});
	});

	describe('set casting', () => {
		it('should cast and set non-boolean value', () => {
			const bool = gawk(true);
			bool.val = undefined;         expect(bool.val).to.be.false;
			bool.val = null;              expect(bool.val).to.be.false;
			bool.val = 'foo';             expect(bool.val).to.be.true;
			bool.val = 123;               expect(bool.val).to.be.true;
			bool.val = 3.14;              expect(bool.val).to.be.true;
			bool.val = NaN;               expect(bool.val).to.be.false;
			bool.val = ['a', 'b'];        expect(bool.val).to.be.true;
			bool.val = { foo: 'bar' };    expect(bool.val).to.be.true;
			bool.val = function () {};    expect(bool.val).to.be.true;
		});

		it('should cast and set another gawk type', () => {
			const bool = gawk(true);
			bool.val = gawk();                  expect(bool.val).to.be.false;
			bool.val = gawk(null);              expect(bool.val).to.be.false;
			bool.val = gawk('foo');             expect(bool.val).to.be.true;
			bool.val = gawk(123);               expect(bool.val).to.be.true;
			bool.val = gawk(3.14);              expect(bool.val).to.be.true;
			bool.val = gawk(NaN);               expect(bool.val).to.be.false;
			bool.val = gawk(['a', 'b']);        expect(bool.val).to.be.true;
			bool.val = gawk({ foo: 'bar' });    expect(bool.val).to.be.true;
			bool.val = gawk(function () {});    expect(bool.val).to.be.true;
		});

		it('should copy another gawked boolean', () => {
			const bool = gawk(true);
			bool.val = gawk(false);
			expect(bool.val).to.be.false;
		});

		it('should set from Boolean object', () => {
			const bool = gawk(true);
			bool.val = new Boolean(false);
			expect(bool.val).to.be.false;
		});
	});

	describe('built-ins', () => {
		it('should support toString() with true value', () => {
			expect(gawk(true).toString()).to.equal('true');
		});

		it('should support toString() with false value', () => {
			expect(gawk(false).toString()).to.equal('false');
		});

		it('should support valueOf() with true value', () => {
			expect(gawk(true).valueOf()).to.be.true;
		});

		it('should support valueOf() with false value', () => {
			expect(gawk(false).valueOf()).to.be.false;
		});
	});

	describe('notifications', () => {
		it('should be notified when value changes', () => {
			const bool = gawk(true);

			bool.watch(evt => {
				expect(evt.targets[0]).to.equal(bool);

				const val = evt.targets[0].val;
				expect(val).to.be.a.boolean;
				expect(val).to.equal(false);
			});

			bool.val = false;
		});

		it('should only notify if value is uniquely changed', () => {
			const bool = gawk(true);
			let count = 0;

			bool.watch(evt => {
				count++;
			});

			bool.val = false;
			expect(count).to.equal(1);

			bool.val = false;
			expect(count).to.equal(1);
		});

		it('should unwatch changes', () => {
			const bool = gawk(true);
			let count = 0;

			const unwatch = bool.watch(evt => {
				count++;
			});

			bool.val = false;
			bool.val = true;

			unwatch();

			bool.val = false;
			bool.val = true;

			expect(count).to.equal(2);
		});
	});
});
