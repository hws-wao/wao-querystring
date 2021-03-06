// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

module.exports = function(qs, sep, eq, options) {
  // If obj.hasOwnProperty has been overridden, then calling
  // obj.hasOwnProperty(prop) will break.
  // See: https://github.com/joyent/node/issues/1707
  var hasOwnProperty = function (obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  };

  var parseNested = function (k, p, v, obj) {
    var s = k.split('.');
    var me = s.shift();
    var tmp = (hasOwnProperty(obj[p], me)) ? obj[p] : newobj(me, {});
    if (s.length > 0) {
      $.extend(obj[p], parseNested(s.join('.'), me, v, tmp));
    } else {
       if (Array.isArray(obj[p])) {
        var len = obj[p].length;
        if (hasOwnProperty(obj[p][len-1], me)) {
          obj[p].push(newobj(me, v));
        } else {
          obj[p][len-1][me] = v;
        }
      } else if (!hasOwnProperty(obj[p], me)) {
        obj[p][me] = v;
      } else {
        obj[p] = [obj[p], newobj(me, v)];
      }
    }
    return obj;
  };

  var newobj = function (k, v) {
    var newobj = {};
    newobj[k] = v;
    return newobj;
  };

  sep = sep || '&';
  eq = eq || '=';
  var ROOT = '_';
  var obj = {};
  obj[ROOT] = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }
  var defaultPrefix;
  if (options && typeof options.defaultPrefix === 'string') {
    defaultPrefix = options.defaultPrefix;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (defaultPrefix && k.substr(0, 1) !== ROOT) {
      k = defaultPrefix + '.' + k;
    }


    obj = parseNested(k, ROOT, v, obj);
  }

  return obj[ROOT];
};
