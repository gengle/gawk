import gawk from '../src/index.js';

const gobj = gawk({
	foo: {
		bar: {}
	}
});

let counter = 0;
gawk.watch(gobj, () => {
	counter++;
});

const n = 100000;
console.log(`Set size: ${n}`);

const start = Date.now();

for (let i = 0; i < n; i++) {
	gawk.mergeDeep(gobj.foo, {
		bar: {
			baz: {
				a: Math.random(),
				b: Math.random(),
				c: Math.random()
			}
		}
	});
}

const delta = Date.now() - start;

console.log('Finished in ' + (delta / 1000).toFixed(2) + 's');

if (counter === n) {
	console.log(`Worked! Fired watcher ${counter} times`);
} else {
	console.log(`Failed! Expected ${n} events, got ${counter}`);
}
