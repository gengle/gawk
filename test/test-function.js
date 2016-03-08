import { gawk, GawkFunction } from '../src/index';

describe('object', () => {
	it('should gawk a function', () => {
		let count = 0;
		const gobj = gawk((x, y) => {
			count++;
			return x + y;
		});
		expect(gobj).to.be.an.instanceof(GawkFunction);

		expect(gobj.exec(3, 7)).to.equal(10);

		const fn = gobj.val;
		expect(fn(3, 7)).to.equal(10);

		expect(count).to.equal(2);
	});

	it('should fail to gawk non-function arg', () => {
		expect(() => {
			new GawkFunction('foo');
		}).to.throw(TypeError);
	});

	it('should fail to gawk another non-function gawked type', () => {
		expect(() => {
			new GawkFunction(gawk('hi'));
		}).to.throw(TypeError);
	});

	it('should fail to set non-function', () => {
		expect(() => {
			const gobj = gawk(function () {});
			gobj.val = 'foo';
		}).to.throw(TypeError);
	});

	it('should copy another gawked function', () => {
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

	it('should support toString()', () => {
		const fn = function () {};
		const gobj = gawk(fn);
		expect(gobj.toString()).to.equal(fn.toString());
	});

	it('should support valueOf()', () => {
		const fn = function () {};
		const gobj = gawk(fn);
		expect(gobj.valueOf()).to.equal(fn.valueOf());
	});
});
