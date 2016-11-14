# gawk

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Travis CI Build][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![Code Climate][codeclimate-image]][codeclimate-url]
[![Deps][david-image]][david-url]
[![Dev Deps][david-dev-image]][david-dev-url]

Gawk is a observable model that wraps JavaScript data types. Once a JavaScript
value is gawked, you can listen for changes including deeply nested changes.

Only arrays and objects can be gawked. All other types are passed through.

> Note: gawk uses ES2015 proxies and thus requires Node.js 6 or newer.

## Installation

    npm install gawk

## Examples

```javascript
import gawk from 'gawk';

const obj = gawk({
    foo: 'bar'
});

gawk.watch(obj, (obj, source) => {
    console.info('object changed!');
    console.info('new value =', evt.target);
});

obj.foo = 'baz';

console.info(obj); // { foo: 'baz' }
```

You can also be notified if a deep child is changed:

```javascript
const obj = gawk({
    foo: {
        bar: ['a', 'b']
    }
});

gawk.watch(obj, (obj, source) => {
    console.info('object changed!');
    console.info('new value =', evt.target);
});

obj.foo.bar.push('c', 'd');

console.info(obj); // { foo: { bar: ['a', 'b', 'c', 'd'] } }
```

You can also directly create `GawkObject` and `GawkArray` objects:

```javascript
import { GawkArray, GawkObject } from 'gawk';

const obj = new GawkObject({ foo: 'bar' });
const arr = new GawkArray('a', 'b', 'c');
```

## Upgrading to v3

Gawk v3 has dropped all gawk data types except `GawkArray` and `GawkObject`.

Since Gawk v3 uses ES6 Proxies, you no longer need to call `obj.get()`,
`obj.set()`, `obj.delete()`, etc.

Methods `obj.watch()`, `obj.merge()`, and `obj.mergeDeep()` have moved to
`gawk.watch()`, `gawk.merge()`, and `gawk.mergeDeep()`. The first argument must
be a gawk object.

Gawk v3 no longer hashes values. This means speed. Gawk v3 is about 19 times
faster than v1 and v2.

## License

(The MIT License)

Copyright (c) 2016 Chris Barber

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

[npm-image]: https://img.shields.io/npm/v/gawk.svg
[npm-url]: https://npmjs.org/package/gawk
[downloads-image]: https://img.shields.io/npm/dm/gawk.svg
[downloads-url]: https://npmjs.org/package/gawk
[travis-image]: https://img.shields.io/travis/cb1kenobi/gawk.svg
[travis-url]: https://travis-ci.org/cb1kenobi/gawk
[coveralls-image]: https://img.shields.io/coveralls/cb1kenobi/gawk/master.svg
[coveralls-url]: https://coveralls.io/r/cb1kenobi/gawk
[codeclimate-image]: https://img.shields.io/codeclimate/github/cb1kenobi/gawk.svg
[codeclimate-url]: https://codeclimate.com/github/cb1kenobi/gawk
[david-image]: https://img.shields.io/david/cb1kenobi/gawk.svg
[david-url]: https://david-dm.org/cb1kenobi/gawk
[david-dev-image]: https://img.shields.io/david/dev/cb1kenobi/gawk.svg
[david-dev-url]: https://david-dm.org/cb1kenobi/gawk#info=devDependencies
