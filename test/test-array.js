import { gawk, GawkArray } from '../src/index';

describe('array', () => {
	it('should return empty array', () => {
		const data = [];
		const gobj = gawk(data);
		expect(gobj).to.be.an.instanceof(GawkArray);
		const val = gobj.val();
		expect(val).to.be.an.array;
		expect(val).to.have.lengthOf(data.length);
		expect(val).to.deep.equal(data);
	});

	it('should return a populated array of strings', () => {
		const data = ['a', 'b', 'c'];
		const gobj = gawk(data);
		expect(gobj).to.be.an.instanceof(GawkArray);
		const val = gobj.val();
		expect(val).to.be.an.array;
		expect(val).to.have.lengthOf(data.length);
		expect(val).to.deep.equal(data);
	});

	it('should return a populated array of mixed', () => {
		const data = ['a', 1, null, undefined, NaN, ['b', 2]];
		const gobj = gawk(data);
		expect(gobj).to.be.an.instanceof(GawkArray);
		const val = gobj.val();
		expect(val).to.be.an.array;
		expect(val).to.have.lengthOf(data.length);
		expect(val).to.deep.equal(data);
	});

	it('should push a new element onto an array', () => {
		it('should return a populated array of strings', () => {
			const gobj = gawk(['a', 'b']);
			expect(gobj).to.be.an.instanceof(GawkArray);
			gobj.push('c');

			const val = gobj.val();
			expect(val).to.be.an.array;
			expect(val).to.have.lengthOf(3);
			expect(val).to.deep.equal(['a', 'b', 'c']);
		});
	});

	it('should be notified when array changes', () => {
		const gobj = gawk(['a', 'b']);
		expect(gobj).to.be.an.instanceof(GawkArray);

		gobj.watch(evt => {
			const val = evt.target.val();
			expect(val).to.be.an.array;
			expect(val).to.have.lengthOf(3);
			expect(val).to.deep.equal(['a', 'b', 'c']);
		});

		gobj.push('c');
	});

	it('should be notified when array child changes', () => {
		const gobj = gawk(['a', 'b', ['c']]);
		expect(gobj).to.be.an.instanceof(GawkArray);

		gobj.watch(evt => {
			const val = evt.target.val();
			expect(val).to.be.an.array;
			expect(val).to.have.lengthOf(3);
			expect(val).to.deep.equal(['a', 'b', ['c', 'd']]);
		});

		gobj.value[2].push('d');
	});
});
