const { orderBy } = require('natural-orderby');
const _get = require('lodash/get');

function isFunction(value) {
  return typeof value === 'function';
}

function natSort(list, getter = (v) => v) {
  const getValue = isFunction(getter) ? getter : (v) => _get(v, getter);
  return orderBy(list, [(v) => getValue(v).replace(/[_-]/g, ' '), getValue]);
}

module.exports = {
  natSort
};
