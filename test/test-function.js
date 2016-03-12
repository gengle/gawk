import { gawk, GawkFunction } from '../src/index';

describe('function', () => {
	describe('gawking', () => {
		it('should gawk a function', () => {
			const fn = gawk(function () {});
			expect(fn).to.be.an.instanceof(GawkFunction);
			expect(fn.val).to.be.a.function;
		});

		it('should gawk an arrow function', () => {
			const fn = gawk(() => {});
			expect(fn).to.be.an.instanceof(GawkFunction);
			expect(fn.val).to.be.a.function;
		});

		it('should gawk function from Function object', () => {
			const fn = gawk(new Function('return 1'));
			expect(fn).to.be.an.instanceof(GawkFunction);
			expect(fn.val).to.be.a.function;
		});
	});

	describe('constructor casting', () => {
		it('should throw TypeError for non-function value', () => {
			expect(() => new GawkFunction).to.throw(TypeError);
			expect(() => new GawkFunction(null)).to.throw(TypeError);
			expect(() => new GawkFunction(true)).to.throw(TypeError);
			expect(() => new GawkFunction('foo')).to.throw(TypeError);
			expect(() => new GawkFunction(123)).to.throw(TypeError);
			expect(() => new GawkFunction(3.14)).to.throw(TypeError);
			expect(() => new GawkFunction(NaN)).to.throw(TypeError);
			expect(() => new GawkFunction(['a', 'b'])).to.throw(TypeError);
			expect(() => new GawkFunction({ foo: 'bar' })).to.throw(TypeError);
		});

		it('should throw TypeError for non-function gawk type', () => {
			expect(() => new GawkFunction(gawk())).to.throw(TypeError);
			expect(() => new GawkFunction(gawk(null))).to.throw(TypeError);
			expect(() => new GawkFunction(gawk(true))).to.throw(TypeError);
			expect(() => new GawkFunction(gawk('foo'))).to.throw(TypeError);
			expect(() => new GawkFunction(gawk(123))).to.throw(TypeError);
			expect(() => new GawkFunction(gawk(3.14))).to.throw(TypeError);
			expect(() => new GawkFunction(gawk(NaN))).to.throw(TypeError);
			expect(() => new GawkFunction(gawk(['a', 'b']))).to.throw(TypeError);
			expect(() => new GawkFunction(gawk({ foo: 'bar' }))).to.throw(TypeError);
		});

		it('should copy another gawked function', () => {
			const fn = new GawkFunction(gawk(function () {}));
			expect(fn.val).to.be.a.function;
		});
	});

	describe('set casting', () => {
		it('should throw TypeError when setting non-function value', () => {
			const fn = gawk(function () {});
			expect(() => { fn.val = undefined; }).to.throw(TypeError);
			expect(() => { fn.val = null; }).to.throw(TypeError);
			expect(() => { fn.val = true; }).to.throw(TypeError);
			expect(() => { fn.val = 'foo'; }).to.throw(TypeError);
			expect(() => { fn.val = 123; }).to.throw(TypeError);
			expect(() => { fn.val = 3.14; }).to.throw(TypeError);
			expect(() => { fn.val = NaN; }).to.throw(TypeError);
			expect(() => { fn.val = ['a', 'b']; }).to.throw(TypeError);
			expect(() => { fn.val = { foo: 'bar' }; }).to.throw(TypeError);
		});

		it('should throw TypeError when setting non-function gawk type', () => {
			const fn = gawk(function () {});
			expect(() => { fn.val = gawk(); }).to.throw(TypeError);
			expect(() => { fn.val = gawk(null); }).to.throw(TypeError);
			expect(() => { fn.val = gawk(true); }).to.throw(TypeError);
			expect(() => { fn.val = gawk('foo'); }).to.throw(TypeError);
			expect(() => { fn.val = gawk(123); }).to.throw(TypeError);
			expect(() => { fn.val = gawk(3.14); }).to.throw(TypeError);
			expect(() => { fn.val = gawk(NaN); }).to.throw(TypeError);
			expect(() => { fn.val = gawk(['a', 'b']); }).to.throw(TypeError);
			expect(() => { fn.val = gawk({ foo: 'bar' }); }).to.throw(TypeError);
		});

		it('should copy another gawked function', () => {
			function foo() {}
			function bar() {}
			const fn = gawk(foo);
			fn.val = gawk(bar);
			expect(fn.val).to.equal(bar);
		});
	});

	describe('built-ins', () => {
		it('should support toString()', () => {
			function foo() {}
			expect(gawk(foo).toString()).to.equal(foo.toString());
		});

		it('should support valueOf()', () => {
			function foo() {}
			expect(gawk(foo).valueOf()).to.equal(foo);
		});
	});

	describe('methods', () => {
		describe('exec()', () => {
			it('should execute the function', () => {
				let count = 0;
				const fn = gawk((x, y) => {
					count++;
					return x + y;
				});
				expect(fn).to.be.an.instanceof(GawkFunction);

				expect(fn.exec(3, 7)).to.equal(10);

				const fn2 = fn.val;
				expect(fn2(3, 7)).to.equal(10);

				expect(count).to.equal(2);
			});

			it('should execute another gawked function', () => {
				let count = 0;
				const fn = gawk((x, y) => {
					count++;
					return x + y;
				});
				expect(fn).to.be.an.instanceof(GawkFunction);

				const fn2 = new GawkFunction(fn);
				expect(fn2.exec(3, 7)).to.equal(10);

				expect(count).to.equal(1);
			});
		});
	});

	describe('notifications', () => {
		it('should be notified when value changes', () => {
			function foo() {}
			const fn = gawk(function () {});

			fn.watch(evt => {
				expect(evt.target).to.equal(fn);

				const val = evt.target.val;
				expect(val).to.be.a.function;
				expect(val).to.equal(foo);
			});

			fn.val = foo;
		});

		it('should only notify if value is uniquely changed', () => {
			function foo() {}
			const fn = gawk(function () {});
			let count = 0;

			fn.watch(evt => {
				count++;
			});

			fn.val = foo;
			expect(count).to.equal(1);

			fn.val = foo;
			expect(count).to.equal(1);
		});

		it('should unwatch changes', () => {
			const fn = gawk(function () {});
			let count = 0;

			const unwatch = fn.watch(evt => {
				count++;
			});

			fn.val = function () {};
			fn.val = function () {};

			unwatch();

			fn.val = function () {};
			fn.val = function () {};

			expect(count).to.equal(2);
		});
	});
});
