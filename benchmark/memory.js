const gawk = require('../dist/index').gawk;

const before = process.memoryUsage();
console.log(before);

const n = 100000;
console.log(`Set size: ${n}`);

const start = Date.now();

for (let i = 0; i < n; i++) {
	gawk({
		foo: {
			bar: {}
		}
	});
}

const delta = Date.now() - start;

const after = process.memoryUsage();
console.log(after);

console.log('Memory used: ' + (after.heapUsed - before.heapUsed));

console.log('Finished in ' + (delta / 1000).toFixed(2) + 's');
