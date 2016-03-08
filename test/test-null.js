import { gawk, GawkNull } from '../src/index';

describe('null', () => {
	it('should gawk null', () => {
		const gobj = gawk(null);
		expect(gobj).to.be.an.instanceof(GawkNull);
		expect(gobj.val).to.be.null;
	});

	it('should continue if being set to non-null', () => {
		expect(() => {
			const gobj = gawk(null);
			gobj.val = 'foo';
			expect(gobj.val).to.be.null;
		}).not.to.throw(TypeError);
	});

	it('should support toString()', () => {
		const gobj = gawk(null);
		expect(gobj.toString()).to.equal('');
	});

	it('should support valueOf()', () => {
		const gobj = gawk(null);
		expect(gobj.valueOf()).to.be.null;
	});
});
