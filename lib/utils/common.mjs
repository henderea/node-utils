//#region Value Detection Functions
export function isType(value, type) {
  if(type !== 'undefined' && typeof value === 'undefined') { return false; }
  if(type !== 'null' && value === null) { return false; }
  if(type === 'null') { return value === null; }
  return typeof value === type;
}

export function isUndefined(value) {
  return isType(value, 'undefined');
}

export function isNil(value) {
  return isUndefined(value) || isType(value, 'null');
}

export function isString(value) {
  return isType(value,  'string');
}

export function isNumber(value) {
  return isType(value,  'number');
}

export function isArray(value) {
  return !isNil(value) && Array.isArray(value);
}

export function isObject(value) {
  return isType(value, 'object');
}

export function isFunction(value) {
  return isType(value, 'function');
}

export function isBlank(value) {
  return isNil(value) || String(value).trim() == '';
}

export function listNotEmpty(value) {
  return isArray(value) && value.length > 0;
}

export function listEmpty(value) {
  return isNil(value) || (isArray(value) && value.length == 0);
}

export function isEmpty(value) {
  if(isNil(value)) { return true; }
  if(isArray(value)) { return value.length == 0; }
  if(isObject(value)) { return Object.keys(value).length == 0; }
  if(isString(value)) { return value === ''; }
  if(isNumber(value)) { return value === 0; }
  return String(value) === '';
}
//#endregion

//#region Async Array Functions
export async function eachAsync(list, func) {
  if(!isArray(list)) { return; }
  for(let i = 0; i < list.length; i++) {
    await func(list[i], i, list);
  }
}

export async function mapAsync(list, func) {
  if(!isArray(list)) { return list; }
  const rv = [];
  for(let i = 0; i < list.length; i++) {
    rv.push(await func(list[i], i, list));
  }
  return rv;
}

export async function filterAsync(list, func) {
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
export function compact(list) {
  if(!isArray(list)) { return list; }
  return list.filter((e) => !isNil(e) && e !== false);
}

export function getAtIndex(list, i) {
  if(!isArray(list) || list.length == 0) { return undefined; }
  let ind = i;
  if(ind < 0) {
    ind = list.length + ind;
  }
  if(ind < 0 || ind >= list.length) { return undefined; }
  return list[ind];
}

export function last(list) {
  return getAtIndex(list, -1);
}

export function times(num, func) {
  if(num <= 0) { return []; }
  const rv = [];
  for(let i = 0; i < num; i++) {
    rv.push(func(i));
  }
  return rv;
}

export function concat(array, ...arrays) {
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

export function flatten(array) {
  if(!isArray(array)) { return undefined; }
  const rv = [];
  array.forEach((v) => {
    if(isArray(v)) {
      rv.push(...v);
    } else {
      array.push(v);
    }
  });
  return rv;
}

export function flattenDeep(array) {
  if(!isArray(array)) { return undefined; }
  const rv = [];
  array.forEach((v) => {
    if(isArray(v)) {
      rv.push(...flattenDeep(v));
    } else {
      array.push(v);
    }
  });
  return rv;
}
//#endregion

//#region Object Functions
export function hasKey(obj, key) {
  if(!isObject(obj)) { return false; }
  return Object.hasOwnProperty.call(obj, key);
}
//#endregion
