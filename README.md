# gawk

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Travis CI Build][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![Code Climate][codeclimate-image]][codeclimate-url]
[![Deps][david-image]][david-url]
[![Dev Deps][david-dev-image]][david-dev-url]

Gawk is a observable model that wraps JavaScript data types. Once a JavaScript
value is wrapped, it allows you to listen for changes.

Gawk supports the common built-in data types such as string, boolean, number,
array, object, function, null, and undefined. Anything that you can represent
in a JSON object, you can gawk.

You can deeply nest objects too. Gawked arrays, objects, and functions have
additional functions for common tasks. For example, `GawkArray` instances have
`push()` and `pop()` methods.

Gawk should work in web browsers, but it's not tested.

> Note: gawk requires Node.js 4 or newer.

## Installation

    npm install gawk

## Examples

```javascript
import { gawk } from 'gawk';
// or if you're using CommonJS:
// const gawk = require('gawk').gawk;

const obj = gawk({
    foo: 'bar'
});

obj.watch(evt => {
    console.info('object changed!');
    console.info('new value =', evt.value);
});

obj.set('foo', 'baz');

console.info(obj.val); // { foo: 'baz' }
```

You can also be notified if a deep child is changed:

```javascript
const obj = gawk({
    foo: {
        bar: ['a', 'b']
    }
});

obj.watch(evt => {
    console.info('object changed!');
    console.info('new value =', evt.value);
});

obj.get(['foo', 'bar']).push('c', 'd');

console.info(obj.val); // { foo: { bar: ['a', 'b', 'c', 'd'] } }
```

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
