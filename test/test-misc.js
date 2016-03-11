import { gawk } from '../src/index';

describe('misc', () => {
	it('should fail to gawk a symbol', () => {
		expect(() => {
			gawk(Symbol());
		}).to.throw(TypeError);
	});

	it('should fail to gawk if parent is not a gawk object', () => {
		expect(() => {
			gawk('foo', 'bar');
		}).to.throw(TypeError);
	});

	it('should fail to watch with non-function listener', () => {
		expect(() => {
			gawk('foo').watch('bar');
		}).to.throw(TypeError);
	});

	it('should return value as JS', () => {
		expect(gawk().toJS()).to.be.undefined;
		expect(gawk(null).toJS()).to.be.null;
		expect(gawk(true).toJS()).to.equal(true);
		expect(gawk('foo').toJS()).to.equal('foo');
		expect(gawk(123).toJS()).to.equal(123);
		expect(gawk(3.14).toJS()).to.equal(3.14);
		expect(gawk(NaN).toJS()).to.be.NaN;
		expect(gawk(['a', 'b']).toJS()).to.deep.equal(['a', 'b']);
		expect(gawk({ foo: 'bar' }).toJS()).to.deep.equal({ foo: 'bar' });
		function foo() {}
		expect(gawk(foo).toJS()).to.equal(foo);
	});

	it('should return value as a JSON string', () => {
		expect(gawk().toJSON()).to.be.undefined;
		expect(gawk(null).toJSON()).to.equal('null');
		expect(gawk(true).toJSON()).to.equal('true');
		expect(gawk('foo').toJSON()).to.equal('"foo"');
		expect(gawk(123).toJSON()).to.equal('123');
		expect(gawk(3.14).toJSON()).to.equal('3.14');
		expect(gawk(NaN).toJSON()).to.equal('null');
		expect(gawk(['a', 'b']).toJSON()).to.equal('["a","b"]');
		expect(gawk({ foo: 'bar' }).toJSON()).to.equal('{"foo":"bar"}');
		expect(gawk({ foo: 'bar' }).toJSON(true)).to.equal('{\n  "foo": "bar"\n}');
		expect(gawk(function () {}).toJSON()).to.be.undefined;
	});
});
