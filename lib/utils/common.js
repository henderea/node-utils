//#region Value Detection Functions
function isType(value, type) {
  if(type !== 'undefined' && typeof value === 'undefined') { return false; }
  if(type !== 'null' && value === null) { return false; }
  if(type === 'null') { return value === null; }
  return typeof value === type;
}

function isUndefined(value) {
  return isType(value, 'undefined');
}

function isNil(value) {
  return isUndefined(value) || isType(value, 'null');
}

function isString(value) {
  return isType(value,  'string');
}

function isArray(value) {
  return !isNil(value) && Array.isArray(value);
}

function isObject(value) {
  return isType(value, 'object');
}

function isFunction(value) {
  return isType(value, 'function');
}

function isBlank(value) {
  return isNil(value) || String(value).trim() == '';
}
//#endregion

//#region Async Array Functions
async function eachAsync(list, func) {
  if(!isArray(list)) { return; }
  for(let i = 0; i < list.length; i++) {
    await func(list[i], i, list);
  }
}

async function mapAsync(list, func) {
  if(!isArray(list)) { return list; }
  const rv = [];
  for(let i = 0; i < list.length; i++) {
    rv.push(await func(list[i], i, list));
  }
  return rv;
}

async function filterAsync(list, func) {
  if(!isArray(list)) { return list; }
  const rv = [];
  for(let i = 0; i < list.length; i++) {
    if(await func(list[i], i, list)) {
      rv.push(list[i]);
    }
  }
  return rv;
}
//#endregion

//#region Other Array Functions
function compact(list) {
  if(!isArray(list)) { return list; }
  return list.filter((e) => !isNil(e) && e !== false);
}

function getAtIndex(list, i) {
  if(!isArray(list) || list.length == 0) { return undefined; }
  let ind = i;
  if(ind < 0) {
    ind = list.length + ind;
  }
  if(ind < 0 || ind >= list.length) { return undefined; }
  return list[ind];
}

function last(list) {
  return getAtIndex(list, -1);
}

function times(num, func) {
  if(num <= 0) { return []; }
  const rv = [];
  for(let i = 0; i < num; i++) {
    rv.push(func(i));
  }
  return rv;
}

function concat(array, ...arrays) {
  if(!isArray(array)) { return undefined; }
  arrays.forEach((arr) => {
    if(isArray(arr)) {
      array.push(...arr);
    } else {
      array.push(arr);
    }
  });
  return array;
}
//#endregion

//#region Object Functions
function hasKey(obj, key) {
  if(!isObject(obj)) { return false; }
  return Object.hasOwnProperty.call(obj, key);
}
//#endregion

module.exports = {
  isUndefined,
  isNil,
  isString,
  isArray,
  isObject,
  isFunction,
  isBlank,
  eachAsync,
  mapAsync,
  filterAsync,
  compact,
  getAtIndex,
  last,
  times,
  concat,
  hasKey
};
