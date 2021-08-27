import { orderBy } from 'natural-orderby';
import _get from 'lodash/get.js';

function isFunction(value) {
  return typeof value === 'function';
}

export function natSort(list, getter = (v) => v) {
  const getValue = isFunction(getter) ? getter : (v) => _get(v, getter);
  return orderBy(list, [(v) => getValue(v).replace(/[_-]/g, ' '), getValue]);
}
