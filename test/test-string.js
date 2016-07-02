import { gawk, GawkString } from '../src/index';

describe('string', () => {
	describe('gawking', () => {
		it('should gawk an empty string', () => {
			const str = gawk('');
			expect(str).to.be.an.instanceof(GawkString);
			expect(str.val).to.equal('');
		});

		it('should gawk string', () => {
			const str = gawk('foo');
			expect(str).to.be.an.instanceof(GawkString);
			expect(str.val).to.equal('foo');
		});

		it('should gawk string from String object', () => {
			const str = gawk(new String('bar'));
			expect(str).to.be.an.instanceof(GawkString);
			expect(str.val).to.equal('bar');
		});
	});

	describe('constructor casting', () => {
		it('should cast non-string value', () => {
			expect(new GawkString().val).to.equal('');
			expect(new GawkString(null).val).to.equal('null');
			expect(new GawkString(true).val).to.equal('true');
			expect(new GawkString(123).val).to.equal('123');
			expect(new GawkString(3.14).val).to.equal('3.14');
			expect(new GawkString(NaN).val).to.equal('NaN');
			expect(new GawkString(['a', 'b']).val).to.equal('a,b');
			expect(new GawkString({ foo: 'bar' }).val).to.equal('[object Object]');
			expect(new GawkString(function () {}).val).to.equal('function () {}');
		});

		it('should cast another gawk type', () => {
			expect(new GawkString(gawk()).val).to.equal('');
			expect(new GawkString(gawk(null)).val).to.equal('null');
			expect(new GawkString(gawk(true)).val).to.equal('true');
			expect(new GawkString(gawk(123)).val).to.equal('123');
			expect(new GawkString(gawk(3.14)).val).to.equal('3.14');
			expect(new GawkString(gawk(NaN)).val).to.equal('NaN');
			expect(new GawkString(gawk(['a', 'b'])).val).to.equal('a,b');
			expect(new GawkString(gawk({ foo: 'bar' })).val).to.equal('[object Object]');
			expect(new GawkString(gawk(function () {})).val).to.equal('function () {}');
		});

		it('should copy another gawked string', () => {
			const str = new GawkString(gawk('foo'));
			expect(str.val).to.equal('foo');
		});

		it('should fail if parent is not a gawk object', () => {
			expect(() => {
				new GawkString('foo', 'bar');
			}).to.throw(TypeError, 'Parent must be a gawk class');
		});
	});

	describe('set casting', () => {
		it('should cast and set non-string value', () => {
			const str = gawk('');
			str.val = undefined;         expect(str.val).to.equal('');
			str.val = null;              expect(str.val).to.equal('null');
			str.val = true;              expect(str.val).to.equal('true');
			str.val = 123;               expect(str.val).to.equal('123');
			str.val = 3.14;              expect(str.val).to.equal('3.14');
			str.val = NaN;               expect(str.val).to.equal('NaN');
			str.val = ['a', 'b'];        expect(str.val).to.equal('a,b');
			str.val = { foo: 'bar' };    expect(str.val).to.equal('[object Object]');
			str.val = function () {};    expect(str.val).to.equal('function () {}');
		});

		it('should cast and set another gawk type', () => {
			const str = gawk('');
			str.val = gawk();                  expect(str.val).to.equal('');
			str.val = gawk(null);              expect(str.val).to.equal('null');
			str.val = gawk(true);              expect(str.val).to.equal('true');
			str.val = gawk(123);               expect(str.val).to.equal('123');
			str.val = gawk(3.14);              expect(str.val).to.equal('3.14');
			str.val = gawk(NaN);               expect(str.val).to.equal('NaN');
			str.val = gawk(['a', 'b']);        expect(str.val).to.equal('a,b');
			str.val = gawk({ foo: 'bar' });    expect(str.val).to.equal('[object Object]');
			str.val = gawk(function () {});    expect(str.val).to.equal('function () {}');
		});

		it('should copy another gawked string', () => {
			const str = gawk('foo');
			str.val = gawk('bar');
			expect(str.val).to.equal('bar');
		});
	});

	describe('built-ins', () => {
		it('should support toString()', () => {
			expect(gawk('foo').toString()).to.equal('foo');
		});

		it('should support valueOf()', () => {
			expect(gawk('foo').valueOf()).to.equal('foo');
		});
	});

	describe('notifications', () => {
		it('should be notified when value changes', () => {
			const str = gawk('foo');

			str.watch(evt => {
				expect(evt.targets).to.deep.equal([ str ]);

				const val = evt.targets[0].val;
				expect(val).to.be.a.string;
				expect(val).to.equal('bar');
			});

			str.val = 'bar';
		});

		it('should only notify if value is uniquely changed', () => {
			const str = gawk('foo');
			let count = 0;

			str.watch(evt => {
				count++;
			});

			str.val = 'bar';
			expect(count).to.equal(1);

			str.val = 'bar';
			expect(count).to.equal(1);
		});

		it('should unwatch changes', () => {
			const str = gawk('a');
			let count = 0;

			const unwatch = str.watch(evt => {
				count++;
			});

			str.val = 'b';
			str.val = 'c';

			unwatch();

			str.val = 'd';
			str.val = 'e';

			expect(count).to.equal(2);
		});
	});
});
