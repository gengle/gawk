import { gawk, GawkUndefined } from '../src/index';

describe('undefined', () => {
	it('should gawk undefined', () => {
		const gobj = gawk();
		expect(gobj).to.be.an.instanceof(GawkUndefined);
		expect(gobj.val).to.be.undefined;
	});

	it('should continue if being set to non-undefined', () => {
		expect(() => {
			const gobj = gawk();
			gobj.val = 'foo';
			expect(gobj.val).to.be.undefined;
		}).not.to.throw(TypeError);
	});

	it('should support toString()', () => {
		const gobj = gawk();
		expect(gobj.toString()).to.equal('');
	});

	it('should support valueOf()', () => {
		const gobj = gawk();
		expect(gobj.valueOf()).to.be.undefined;
	});
});
