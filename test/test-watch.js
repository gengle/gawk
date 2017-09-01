import gawk, { isGawked } from '../dist/index';

describe('gawk.watch()', () => {
	it('should fail to watch with non-gawk or object type', () => {
		expect(() => {
			gawk.watch('foo');
		}).to.throw(TypeError, 'Expected subject to be gawked');
	});

	it('should fail to watch with invalid filter', () => {
		expect(() => {
			gawk.watch(gawk({}), 123);
		}).to.throw(TypeError, 'Expected filter to be a string or array of strings');
	});

	it('should fail to watch with non-function listener', () => {
		expect(() => {
			gawk.watch(gawk({}));
		}).to.throw(TypeError, 'Expected listener to be a function');

		expect(() => {
			gawk.watch(gawk({}), 'foo', 'bar');
		}).to.throw(TypeError, 'Expected listener to be a function');
	});

	it('should be notified after merge', () => {
		const gobj = gawk({ foo: 'bar' });
		const callback = spy(obj => {
			expect(obj).to.equal(gobj);
			expect(obj).to.deep.equal({ foo: 'bar', bar: 'wiz' });
		});
		gawk.watch(gobj, callback);
		gawk.merge(gobj, { bar: 'wiz' });
		expect(callback).to.be.calledOnce;
	});

	it('should be notified when a key/value is added', () => {
		const gobj = gawk({ foo: 'bar' });
		const callback = spy(obj => {
			expect(obj).to.equal(gobj);
			expect(obj).to.deep.equal({ foo: 'bar', pi: 3.14 });
		});
		gawk.watch(gobj, callback);
		gobj.pi = 3.14;
		expect(callback).to.be.calledOnce;
	});

	it('should be notified when a key/value changes', () => {
		const gobj = gawk({ foo: 'bar' });
		const callback = spy(obj => {
			expect(obj).to.equal(gobj);
			expect(obj).to.deep.equal({ foo: 'wiz' });
		});
		gawk.watch(gobj, callback);
		gobj.foo = 'wiz';
		expect(callback).to.be.calledOnce;
	});

	it('should be notified when a key/value is deleted', () => {
		const gobj = gawk({ foo: 'bar', pi: 3.14 });
		const callback = spy(obj => {
			expect(obj).to.equal(gobj);
			expect(obj).to.deep.equal({ foo: 'bar' });
		});
		gawk.watch(gobj, callback);
		delete gobj.pi;
		expect(callback).to.be.calledOnce;
	});

	it('should not notify when a non-existent key/value is deleted', () => {
		const gobj = gawk({});
		const callback = spy();
		gawk.watch(gobj, callback);
		delete gobj.foo;
		expect(callback).to.be.not.called;
	});

	it('should only notify if key/value is uniquely changed', () => {
		const gobj = gawk({ foo: 'bar' });
		const callback = spy();

		gawk.watch(gobj, callback);
		expect(callback).to.be.not.called;

		gobj.foo = 'baz';
		expect(callback).to.be.calledOnce;

		gobj.foo = 'baz';
		expect(callback).to.be.calledOnce;
	});

	it('should be notified when child changes', () => {
		const gobj = gawk({ foo: { bar: 'baz' } });
		const nested = gobj.foo;

		expect(isGawked(nested)).to.be.true;
		expect(nested.__gawk__.parents.has(gobj)).to.be.true;

		const callback = spy((obj, source) => {
			expect(obj).to.equal(gobj);
			expect(obj).to.deep.equal({
				foo: {
					bar: 'baz',
					pi: 3.14
				}
			});
			expect(source).to.deep.equal({
				bar: 'baz',
				pi: 3.14
			});
		});

		gawk.watch(gobj, callback);

		nested.pi = 3.14;

		expect(callback).to.be.calledOnce;
	});

	it('should notify child watchers if child changes', () => {
		const gobj = gawk({ foo: { bar: 'baz' } });
		const callback = spy();

		gawk.watch(gobj.foo, callback);

		gawk.mergeDeep(gobj, { foo: { bar: 'baz' + Date.now() } });

		expect(callback).to.be.calledOnce;
	});

	it('should be notified when array changes by merge', () => {
		const gobj = gawk({ foo: [] });
		const callback = spy();

		gawk.watch(gobj.foo, callback);

		gawk.mergeDeep(gobj, { foo: [ 1, 2, 3 ] });
		expect(callback).to.be.calledOnce;
		expect(gobj).to.deep.equal({ foo: [ 1, 2, 3 ] });

		gawk.mergeDeep(gobj, { foo: [ 4, 5, 6 ] });
		expect(callback).to.be.calledTwice;
		expect(gobj).to.deep.equal({ foo: [ 4, 5, 6 ] });
	});

	it('should be notified when array changes by deep merge', () => {
		const gobj = gawk({ foo: { bar: [] } });
		const callback = spy();

		gawk.watch(gobj.foo, callback);

		gawk.mergeDeep(gobj, { foo: { bar: [ 1, 2, 3 ] } });
		expect(callback).to.be.calledOnce;
		expect(gobj).to.deep.equal({ foo: { bar: [ 1, 2, 3 ] } });

		gawk.mergeDeep(gobj, { foo: { bar: [ 4, 5, 6 ] } });
		expect(callback).to.be.calledTwice;
		expect(gobj).to.deep.equal({ foo: { bar: [ 4, 5, 6 ] } });
	});

	it('should only notify once after deep merge', () => {
		const gobj = gawk({});
		const callback = spy();

		gawk.watch(gobj, callback);

		gawk.mergeDeep(gobj, {
			foo: {
				a: 'b',
				c: 123,
				d: {
					e: 'f',
					g: 'h'
				}
			}
		});

		expect(gobj).to.deep.equal({
			foo: {
				a: 'b',
				c: 123,
				d: {
					e: 'f',
					g: 'h'
				}
			}
		});

		gawk.mergeDeep(gobj, {
			bar: {
				i: 'j',
				k: 456,
				l: {
					m: 'n',
					o: 'p'
				}
			}
		});

		expect(gobj).to.deep.equal({
			foo: {
				a: 'b',
				c: 123,
				d: {
					e: 'f',
					g: 'h'
				}
			},
			bar: {
				i: 'j',
				k: 456,
				l: {
					m: 'n',
					o: 'p'
				}
			}
		});

		expect(callback).to.be.calledTwice;
	});

	it('should be notified when deep child changes', () => {
		const gobj = gawk({});
		gobj.foo = {};
		gobj.foo.bar = {};
		gobj.foo.bar.baz = [];
		const arr = gobj.foo.bar.baz;

		const callback = spy();
		gawk.watch(gobj, callback);

		arr.push('a');
		arr.push('b');
		expect(callback).to.be.calledTwice;
	});

	it('should notify multiple parents', () => {
		const gobjs = [
			gawk({}),
			gawk({}),
			gawk({})
		];
		const child = gawk({});
		child.bar = [];
		const arr = child.bar;
		let count = 0;

		for (const gobj of gobjs) {
			gobj.foo = child;
		}

		for (const gobj of gobjs) {
			gawk.watch(gobj, obj => {
				count++;
			});
		}

		arr.push('a');
		arr.push('b');
		expect(count).to.equal(6);
	});

	it('should pause and resume notifications', () => {
		const gobj = gawk({ foo: 'bar' });
		const callback = spy();

		gawk.watch(gobj, callback);

		gobj.pi = 3.14;
		expect(callback).to.be.calledOnce;

		const gobj2 = gawk({ wiz: 123 });

		gobj.__gawk__.pause();
		gobj.baz = gobj2;
		expect(callback).to.be.calledOnce;
		gobj.__gawk__.resume();
		expect(callback).to.be.calledTwice;

		gobj.__gawk__.pause();
		gobj.color = 'red';
		expect(callback).to.be.calledTwice;
		gobj2.lorum = 'ipsum';
		expect(callback).to.be.calledTwice;
		gobj.__gawk__.resume();
		expect(callback).to.be.calledThrice;
	});

	it('should notify parent when child has a merge', () => {
		const gobj = gawk({});
		const callback = spy();

		gawk.watch(gobj, callback);

		const child = gawk({});
		gobj.foo = child;
		// { foo: {} }
		expect(callback).to.be.calledOnce;
		expect(child.__gawk__.parents.has(gobj)).to.be.true;

		const bar = gawk({ bar: 'wiz' });
		gawk.merge(child, bar);
		// { foo: { bar: 'wiz' } }
		expect(callback).to.be.calledTwice;
		expect(bar.__gawk__.parents).to.be.null;

		const foo = gobj.foo;
		expect(foo.__gawk__.parents.has(gobj)).to.be.true;

		gawk.merge(child, { bar: 'wow' });
		// { foo: { bar: 'wow' } }
		expect(callback).to.be.calledThrice;
		expect(bar.__gawk__.parents).to.be.null;
		expect(child.__gawk__.parents.has(gobj)).to.be.true;

		expect(gobj).to.deep.equal({ foo: { bar: 'wow' } });
	});

	it('should only notify parent one time when merging multiple objects', () => {
		const gobj = gawk({ foo: 'bar' });
		const callback = spy();

		gawk.watch(gobj, callback);

		gawk.merge(gobj, { baz: 'wiz' }, gawk({ pi: 3.14 })); //, { num: 123 }, gawk({ arr: ['a', 'b'] }));
		expect(gobj).to.deep.equal({ foo: 'bar', baz: 'wiz', pi: 3.14 }); //, num: 123, arr: ['a', 'b'] });
		expect(callback).to.be.calledOnce;
	});

	it('should notify parent one time when child has a deep merge', () => {
		const gobj = gawk({});
		const callback = spy();

		gawk.watch(gobj, callback);

		const child = gawk({ bar: { pow: 123 } });
		gobj.foo = child;
		// { foo: { bar: { pow: 123 } } }
		expect(callback).to.be.calledOnce;

		const bar = gawk({ bar: { wiz: 456 } });
		gawk.mergeDeep(child, bar);
		// { foo: { bar: { pow: 123, wiz: 456 } } }
		expect(callback).to.be.calledTwice;

		const foo = gobj.foo;
		expect(foo.__gawk__.parents.has(gobj)).to.be.true;

		gawk.mergeDeep(child, { bar: { paz: 789 } });
		// { foo: { bar: { pow: 123, wiz: 456, paz: 789 } } }
		expect(callback).to.be.calledThrice;
		expect(bar.__gawk__.parents).to.be.null;

		expect(gobj).to.deep.equal({ foo: { bar: { pow: 123, wiz: 456, paz: 789 } } });
	});

	it('should only notify parent one time when merging multiple objects', () => {
		const gobj = gawk({ foo: { bar: { baz: 'wiz' } } });
		const callback = spy();

		gawk.watch(gobj, callback);

		gawk.mergeDeep(gobj, { foo: { bar: { baz: 'wow' } } });
		expect(gobj).to.deep.equal({ foo: { bar: { baz: 'wow' } } });
		expect(callback).to.be.calledOnce;
	});

	it('should only notify if value is uniquely changed', () => {
		const garr = gawk([ 'a' ]);
		const callback = spy();

		gawk.watch(garr, callback);

		garr.push('b');
		expect(callback).to.be.calledOnce;

		garr[1] = 'b';
		expect(callback).to.be.calledOnce;

		garr[1] = 'c';
		expect(callback).to.be.calledTwice;
	});

	it('should be notified when array changes', () => {
		const gobj = gawk([ 'a', 'b' ]);
		const callback = spy();

		gawk.watch(gobj, callback);

		gobj.push('c');
		gobj.pop();
		gobj.unshift('d');
		gobj.shift();

		expect(callback).to.have.callCount(4);
	});

	it('should be notified when deeply nested children change', () => {
		const callback1 = spy();
		const callback2 = spy();
		const callback3 = spy();

		const arr1 = gawk([]);
		const arr2 = gawk([]);
		const arr3 = gawk([]);

		arr1.push(arr2);
		arr2.push(arr3);

		expect(arr2.__gawk__.parents.has(arr1)).to.be.true;
		expect(arr3.__gawk__.parents.has(arr2)).to.be.true;

		gawk.watch(arr1, callback1);
		gawk.watch(arr2, callback2);
		gawk.watch(arr3, callback3);

		arr3.push('foo');

		expect(callback1).to.be.calledOnce;
		expect(callback2).to.be.calledOnce;
		expect(callback3).to.be.calledOnce;

		expect(arr3.length).to.equal(1);
		expect(arr3).to.deep.equal([ 'foo' ]);

		expect(arr2.length).to.equal(1);
		expect(arr2).to.deep.equal([ [ 'foo' ] ]);

		expect(arr1.length).to.equal(1);
		expect(arr1).to.deep.equal([ [ [ 'foo' ] ] ]);
	});

	it('should notify parent if property is deleted', () => {
		const gobj = gawk({ foo: { bar: 'baz' } });
		const callback = spy();

		gawk.watch(gobj, callback);

		expect(gobj).to.deep.equal({ foo: { bar: 'baz' } });
		delete gobj.foo;
		expect(gobj).to.deep.equal({});

		expect(callback).to.be.calledOnce;
	});

	it('should notify parent if index is deleted', () => {
		const gobj = gawk({ foo: { bar: [ 'baz' ] } });
		const callback = spy();

		gawk.watch(gobj, callback);

		expect(gobj).to.deep.equal({ foo: { bar: [ 'baz' ] } });
		delete gobj.foo.bar[0];
		expect(gobj).to.deep.equal({ foo: { bar: [ undefined ] } });

		expect(callback).to.be.calledOnce;
	});

	it('should copy listeners from another gawk object', () => {
		const gobj = gawk({ foo: 'bar' });
		const callback = spy();

		gawk.watch(gobj, callback);

		const gobj2 = gawk(gobj);
		expect(gobj2).to.deep.equal({ foo: 'bar' });

		gobj2.baz = 'wiz';
		expect(gobj2).to.deep.equal({ foo: 'bar', baz: 'wiz' });
		expect(callback).to.be.calledOnce;
	});

	it('should watch non-object/array properties of a gawk object', () => {
		const gobj = gawk({ foo: { bar: [ 1, 2, 3 ] } });
		let count = 0;

		gawk.watch(gobj, [ 'foo', 'baz' ], obj => {
			if (count === 0) {
				expect(obj).to.equal('pow');
			} else if (count === 1) {
				expect(obj).to.equal('zip');
			} else if (count === 2) {
				expect(obj).to.be.undefined;
			} else if (count === 2) {
				expect(obj).to.equal('zap');
			}
			count++;
		});

		gawk.mergeDeep(gobj, { foo: { bar: [ 4, 5, 6 ] } });
		expect(count).to.equal(0);

		gawk.mergeDeep(gobj, { foo: { baz: 'pow' } });
		expect(count).to.equal(1);

		gawk.mergeDeep(gobj, { foo: { bar: 'bam' } });
		expect(count).to.equal(1);

		gawk.mergeDeep(gobj, { foo: { baz: 'zip' } });
		expect(count).to.equal(2);

		delete gobj.foo.baz;
		expect(count).to.equal(3);

		gobj.foo.baz = 'zap';
		expect(count).to.equal(4);
	});
});

describe('gawk.unwatch()', () => {
	it('should fail to unwatch with non-gawk or object type', () => {
		expect(() => {
			gawk.unwatch('foo');
		}).to.throw(TypeError, 'Expected subject to be gawked');

		expect(() => {
			gawk.unwatch({});
		}).to.throw(TypeError, 'Expected subject to be gawked');
	});

	it('should fail to unwatch with non-function listener', () => {
		expect(() => {
			gawk.unwatch(gawk({}), 'foo');
		}).to.throw(TypeError, 'Expected listener to be a function');
	});

	it('should unwatch gawked object changes', () => {
		const gobj = gawk({});
		const callback = spy();

		gawk.watch(gobj, callback);

		gobj.a = 'b';
		gobj.c = 'd';

		gawk.unwatch(gobj, callback);

		gobj.e = 'f';
		gobj.g = 'h';

		expect(callback).to.be.calledTwice;
	});

	it('should unwatch filtered gawked object changes', () => {
		const gobj = gawk({});
		const callback = spy();

		gawk.watch(gobj, 'a', callback);

		gobj.a = 'b';
		gobj.c = 'd';

		gawk.unwatch(gobj, callback);

		gobj.a = 'f';
		gobj.c = 'h';

		expect(callback).to.be.calledOnce;
	});

	it('should unwatch all listeners', () => {
		const gobj = gawk({});
		let count = 0;

		gawk.watch(gobj, () => {
			count++;
		});

		gawk.watch(gobj, () => {
			count++;
		});

		gobj.a = 'b';
		gobj.c = 'd';

		gawk.unwatch(gobj);

		gobj.e = 'f';
		gobj.g = 'h';

		expect(count).to.equal(4);
	});

	it('should unwatch all filtered listeners', () => {
		const gobj = gawk({});
		let count = 0;

		gawk.watch(gobj, 'a', () => {
			count++;
		});

		gawk.watch(gobj, 'a', () => {
			count++;
		});

		gobj.a = 'b';
		gobj.c = 'd';

		gawk.unwatch(gobj);

		gobj.a = 'f';
		gobj.c = 'h';

		expect(count).to.equal(2);
	});

	it('should unwatch gawked array changes', () => {
		const garr = gawk([ 'a' ]);
		const callback = spy();

		gawk.watch(garr, callback);

		garr.unshift('b');
		garr.unshift('c');

		gawk.unwatch(garr, callback);

		garr.unshift('d');
		garr.unshift('e');

		expect(callback).to.be.calledTwice;
	});
});
