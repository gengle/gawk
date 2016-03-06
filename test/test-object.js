import { gawk, GawkObject } from '../src/index';

describe('object', () => {
	it.skip('should return object', () => {
		const obj = {
			foo: {
				bar: 'wiz'
			}
		};

		const gobj = gawk(obj);

		expect(gobj.val).to.deep.equal(obj);
	});
});

// data.get('foo').get('bar') // wiz
//
// data.get('foo').get('bar').watch(evt => console.log(evt));
// data.watch('foo.bar').watch(evt => console.log(evt));
//
// watch(query)
//
// data.get('foo').delete('bar');
