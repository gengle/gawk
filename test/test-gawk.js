import gawk, { GawkArray, GawkObject } from '../src/index';

describe('gawk', () => {
	it('should not allow __gawk__ to be set', () => {
		const gobj = new GawkObject;
		expect(gobj).to.have.property('__gawk__');
		expect(() => {
			gobj.__gawk__ = 'foo';
		}).to.throw(Error);
	});

	it('should not allow __gawk__ to be deleted', () => {
		const gobj = new GawkObject;
		expect(gobj).to.have.property('__gawk__');
		expect(() => {
			delete gobj.__gawk__;
		}).to.throw(Error);
	});
});
