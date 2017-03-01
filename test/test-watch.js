import gawk, { GawkArray, GawkObject } from '../src/index';

describe('gawk.watch()', () => {
	it('should fail to watch with non-gawk or object type', () => {
		expect(() => {
			gawk.watch('foo');
		}).to.throw(TypeError, 'Expected source to be a GawkArray or GawkObject');
	});

	it('should fail to watch with invalid filter', () => {
		expect(() => {
			gawk.watch(new GawkObject, 123);
		}).to.throw(TypeError, 'Expected filter to be a stirng or array of strings');
	});

	it('should fail to watch with non-function listener', () => {
		expect(() => {
			gawk.watch(new GawkObject);
		}).to.throw(TypeError, 'Expected listener to be a function');

		expect(() => {
			gawk.watch(new GawkObject, 'foo', 'bar');
		}).to.throw(TypeError, 'Expected listener to be a function');
	});

	it('should be notified after merge', () => {
		const gobj = gawk({ foo: 'bar' });
		gawk.watch(gobj, obj => {
			expect(obj).to.equal(gobj);
			expect(obj).to.deep.equal({ foo: 'bar', bar: 'wiz' });
		});
		gawk.merge(gobj, { bar: 'wiz' });
	});

	it('should be notified when a key/value is added', () => {
		const gobj = gawk({ foo: 'bar' });
		gawk.watch(gobj, obj => {
			expect(obj).to.equal(gobj);
			expect(obj).to.deep.equal({ foo: 'bar', pi: 3.14 });
		});
		gobj.pi = 3.14;
	});

	it('should be notified when a key/value changes', () => {
		const gobj = gawk({ foo: 'bar' });
		gawk.watch(gobj, obj => {
			expect(obj).to.equal(gobj);
			expect(obj).to.deep.equal({ foo: 'wiz' });
		});
		gobj.foo = 'wiz';
	});

	it('should be notified when a key/value is deleted', () => {
		const gobj = gawk({ foo: 'bar', pi: 3.14 });
		gawk.watch(gobj, obj => {
			expect(obj).to.equal(gobj);
			expect(obj).to.deep.equal({ foo: 'bar' });
		});
		delete gobj.pi;
	});

	it('should not notify when a non-existent key/value is deleted', () => {
		const gobj = gawk({});
		gawk.watch(gobj, obj => {
			throw new Error('Listener should not have been invoked');
		});
		delete gobj.foo;
	});

	it('should only notify if key/value is uniquely changed', () => {
		const gobj = gawk({ foo: 'bar' });
		let count = 0;

		gawk.watch(gobj, obj => {
			count++;
		});

		gobj.foo = 'baz';
		expect(count).to.equal(1);

		gobj.foo = 'baz';
		expect(count).to.equal(1);
	});

	it('should be notified when child changes', () => {
		const gobj = gawk({ foo: { bar: 'baz' } });
		const nested = gobj.foo;

		expect(nested).to.be.instanceof(GawkObject);
		expect(nested.__gawk__.parents.has(gobj)).to.be.true;

		gawk.watch(gobj, (obj, source) => {
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

		nested.pi = 3.14;
	});

	it('should notify child watchers if child changes', () => {
		const gobj = gawk({ foo: { bar: 'baz' } });
		let count = 0;

		gawk.watch(gobj.foo, (obj, source) => {
			count++;
		});

		gawk.mergeDeep(gobj, { foo: { bar: 'baz' + Date.now() } });

		expect(count).to.equal(1);
	});

	it('should be notified when array changes by merge', () => {
		let count = 0;
		const gobj = gawk({ foo: [] });

		gawk.watch(gobj.foo, obj => {
			count++;
		});

		gawk.mergeDeep(gobj, { foo: [1, 2, 3] });
		expect(count).to.equal(1);
		expect(gobj).to.deep.equal({ foo: [1, 2, 3] });

		gawk.mergeDeep(gobj, { foo: [4, 5, 6] });
		expect(count).to.equal(2);
		expect(gobj).to.deep.equal({ foo: [4, 5, 6] });
	});

	it('should be notified when array changes by deep merge', () => {
		let count = 0;
		const gobj = gawk({ foo: { bar: [] } });

		gawk.watch(gobj.foo, obj => {
			count++;
		});

		gawk.mergeDeep(gobj, { foo: { bar: [1, 2, 3] } });
		expect(count).to.equal(1);
		expect(gobj).to.deep.equal({ foo: { bar: [1, 2, 3] } });

		gawk.mergeDeep(gobj, { foo: { bar: [4, 5, 6] } });
		expect(count).to.equal(2);
		expect(gobj).to.deep.equal({ foo: { bar: [4, 5, 6] } });
	});

	it('should only notify once after deep merge', () => {
		const gobj = new GawkObject;
		let counter = 0;

		gawk.watch(gobj, obj => {
			counter++;
		});

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

		expect(counter).to.equal(2);
	});

	it('should be notified when deep child changes', () => {
		const gobj = gawk({});
		gobj.foo = {};
		gobj.foo.bar = {};
		gobj.foo.bar.baz = [];
		const arr = gobj.foo.bar.baz;

		let count = 0;
		gawk.watch(gobj, obj => {
			count++;
		});

		arr.push('a');
		arr.push('b');
		expect(count).to.equal(2);
	});

	it('should notify multiple parents', () => {
		const gobjs = [
			new GawkObject,
			new GawkObject,
			new GawkObject
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
		let counter = 0;

		gawk.watch(gobj, obj => {
			counter++;
		});

		gobj.pi = 3.14;
		expect(counter).to.equal(1);

		const gobj2 = new GawkObject({ wiz: 123 });

		gobj.__gawk__.pause();
		gobj.baz = gobj2;
		expect(counter).to.equal(1);
		gobj.__gawk__.resume();
		expect(counter).to.equal(2);

		gobj.__gawk__.pause();
		gobj.color = 'red';
		expect(counter).to.equal(2);
		gobj2.lorum = 'ipsum';
		expect(counter).to.equal(2);
		gobj.__gawk__.resume();
		expect(counter).to.equal(3);
	});

	it('should notify parent when child has a merge', () => {
		const gobj = gawk({});
		let count = 0;

		gawk.watch(gobj, obj => {
			count++;
		});

		const child = gawk({});
		gobj.foo = child;
		// { foo: {} }
		expect(count).to.equal(1);
		expect(child.__gawk__.parents.has(gobj)).to.be.true;

		const bar = gawk({ bar: 'wiz' });
		gawk.merge(child, bar);
		// { foo: { bar: 'wiz' } }
		expect(count).to.equal(2);
		expect(bar.__gawk__.parents.has(child)).to.be.false;

		const foo = gobj.foo;
		expect(foo.__gawk__.parents.has(gobj)).to.be.true;

		gawk.merge(child, { bar: 'wow' });
		// { foo: { bar: 'wow' } }
		expect(count).to.equal(3);
		expect(bar.__gawk__.parents.has(child)).to.be.false;
		expect(child.__gawk__.parents.has(gobj)).to.be.true;

		expect(gobj).to.deep.equal({ foo: { bar: 'wow' } });
	});

	it('should only notify parent one time when merging multiple objects', () => {
		const gobj = gawk({ foo: 'bar' });
		let count = 0;

		gawk.watch(gobj, obj => {
			count++;
		});

		gawk.merge(gobj, { baz: 'wiz' }, gawk({ pi: 3.14 })); //, { num: 123 }, gawk({ arr: ['a', 'b'] }));
		expect(gobj).to.deep.equal({ foo: 'bar', baz: 'wiz', pi: 3.14 }); //, num: 123, arr: ['a', 'b'] });
		expect(count).to.equal(1);
	});

	it('should notify parent one time when child has a deep merge', () => {
		const gobj = gawk({});
		let count = 0;

		gawk.watch(gobj, obj => {
			count++;
		});

		const child = gawk({ bar: { pow: 123 } });
		gobj.foo = child;
		// { foo: { bar: { pow: 123 } } }
		expect(count).to.equal(1);

		const bar = gawk({ bar: { wiz: 456 } });
		gawk.mergeDeep(child, bar);
		// { foo: { bar: { pow: 123, wiz: 456 } } }
		expect(count).to.equal(2);

		const foo = gobj.foo;
		expect(foo.__gawk__.parents.has(gobj)).to.be.true;

		gawk.mergeDeep(child, { bar: { paz: 789 } });
		// { foo: { bar: { pow: 123, wiz: 456, paz: 789 } } }
		expect(count).to.equal(3);
		expect(bar.__gawk__.parents.has(child)).to.be.false;

		expect(gobj).to.deep.equal({ foo: { bar: { pow: 123, wiz: 456, paz: 789 } } });
	});

	it('should only notify parent one time when merging multiple objects', () => {
		const gobj = gawk({ foo: { bar: { baz: 'wiz' } } });
		let count = 0;

		gawk.watch(gobj, obj => {
			count++;
		});

		gawk.mergeDeep(gobj, { foo: { bar: { baz: 'wow' } } });
		expect(gobj).to.deep.equal({ foo: { bar: { baz: 'wow' } } });
		expect(count).to.equal(1);
	});

	it('should only notify if value is uniquely changed', () => {
		const garr = gawk(['a']);
		let count = 0;

		gawk.watch(garr, obj => {
			count++;
		});

		garr.push('b');
		expect(count).to.equal(1);

		garr[1] = 'b';
		expect(count).to.equal(1);

		garr[1] = 'c';
		expect(count).to.equal(2);
	});

	it('should be notified when array changes', () => {
		let count = 0;
		const gobj = gawk(['a', 'b']);

		gawk.watch(gobj, obj => {
			count++;
		});

		gobj.push('c');
		gobj.pop();
		gobj.unshift('d');
		gobj.shift();

		expect(count).to.equal(4);
	});

	it('should be notified when deeply nested children change', () => {
		let count1 = 0;
		let count2 = 0;
		let count3 = 0;

		const arr1 = gawk([]);
		const arr2 = gawk([]);
		const arr3 = gawk([]);

		arr1.push(arr2);
		arr2.push(arr3);

		expect(arr2.__gawk__.parents.has(arr1)).to.be.true;
		expect(arr3.__gawk__.parents.has(arr2)).to.be.true;

		gawk.watch(arr1, obj => {
			count1++;
		});

		gawk.watch(arr2, obj => {
			count2++;
		});

		gawk.watch(arr3, obj => {
			count3++;
		});

		arr3.push('foo');

		expect(count1).to.equal(1);
		expect(count2).to.equal(1);
		expect(count3).to.equal(1);

		expect(arr3.length).to.equal(1);
		expect(arr3).to.deep.equal(['foo']);

		expect(arr2.length).to.equal(1);
		expect(arr2).to.deep.equal([['foo']]);

		expect(arr1.length).to.equal(1);
		expect(arr1).to.deep.equal([[['foo']]]);
	});

	it('should notify parent if property is deleted', () => {
		const gobj = gawk({ foo: { bar: 'baz' } });

		let count = 0;
		gawk.watch(gobj, obj => {
			count++;
		});

		expect(gobj).to.deep.equal({ foo: { bar: 'baz' } });
		delete gobj.foo;
		expect(gobj).to.deep.equal({});

		expect(count).to.equal(1);
	});

	it('should notify parent if index is deleted', () => {
		const gobj = gawk({ foo: { bar: [ 'baz' ] } });

		let count = 0;
		gawk.watch(gobj, obj => {
			count++;
		});

		expect(gobj).to.deep.equal({ foo: { bar: [ 'baz' ] } });
		delete gobj.foo.bar[0];
		expect(gobj).to.deep.equal({ foo: { bar: [] } });

		expect(count).to.equal(1);
	});

	it('should copy listeners from another gawk object', () => {
		const gobj = gawk({ foo: 'bar' });

		let count = 0;
		gawk.watch(gobj, obj => {
			count++;
		});

		const gobj2 = new GawkObject(gobj);
		expect(gobj2).to.deep.equal({ foo: 'bar' });

		gobj2.baz = 'wiz';
		expect(gobj2).to.deep.equal({ foo: 'bar', baz: 'wiz' });
		expect(count).to.equal(1);
	});

	it('should watch non-object/array properties of a gawk object', () => {
		const gobj = new GawkObject({ foo: { bar: [1, 2, 3] } });
		let count = 0;

		gawk.watch(gobj, ['foo', 'baz'], obj => {
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

		gawk.mergeDeep(gobj, { foo: { bar: [4, 5, 6] } });
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
		}).to.throw(TypeError, 'Expected source to be a GawkArray or GawkObject');

		expect(() => {
			gawk.unwatch({});
		}).to.throw(TypeError, 'Expected source to be a GawkArray or GawkObject');
	});

	it('should fail to unwatch with non-function listener', () => {
		expect(() => {
			gawk.unwatch(gawk({}));
		}).to.throw(TypeError, 'Expected listener to be a function');

		expect(() => {
			gawk.unwatch(gawk({}), 'foo');
		}).to.throw(TypeError, 'Expected listener to be a function');
	});

	it('should unwatch GawkObject changes', () => {
		const gobj = gawk({});
		let count = 0;
		const listener = () => {
			count++;
		};

		gawk.watch(gobj, listener);

		gobj.a = 'b';
		gobj.c = 'd';

		gawk.unwatch(gobj, listener);

		gobj.e = 'f';
		gobj.g = 'h';

		expect(count).to.equal(2);
	});

	it('should unwatch GawkArray changes', () => {
		const garr = gawk(['a']);
		let count = 0;
		const listener = obj => {
			count++;
		};

		gawk.watch(garr, listener);

		garr.unshift('b');
		garr.unshift('c');

		gawk.unwatch(garr, listener);

		garr.unshift('d');
		garr.unshift('e');

		expect(count).to.equal(2);
	});
});
