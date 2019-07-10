const _uniq = require('lodash/uniq');
const _map = require('lodash/map');
const _filter = require('lodash/filter');
const _flatten = require('lodash/flatten');
const _isFunction = require('lodash/isFunction');
const _isPlainObject = require('lodash/isPlainObject');
const _isNumber = require('lodash/isNumber');
const _isString = require('lodash/isString');

const _isNumberOrString = v => _isNumber(v) || _isString(v);

const style = (...sty) => {
    sty = _map(sty, s => (_isFunction(s) && s.sty) ? s.sty : s);
    sty = _flatten(sty);
    sty = _filter(sty, s => _isPlainObject(s) && _isNumberOrString(s.open) && _isNumberOrString(s.close));
    sty = _uniq(sty);
    let func = function(str) { return `\u001B[${_map(sty, 'open').join(';')}m${str}\u001B[${_map(sty, 'close').join(';')}m`; }
    func.sty = sty;
    return func;
}

const bright = (sty, open, close) => {
    sty.bright = style(p(open, close));
    return sty;
}

const p = (open, close) => ({open, close});
const styles = {
    bold: style(p(1, 22)),
    dim: style(p(2, 22)),
    italic: style(p(3, 23)),
    underline: style(p(4, 24)),
    black: bright(style(p(30, 39)), 90, 39),
    red: bright(style(p(31, 39)), 91, 39),
    green: bright(style(p(32, 39)), 92, 39),
    yellow: bright(style(p(33, 39)), 93, 39),
    blue: bright(style(p(34, 39)), 94, 39),
    magenta: bright(style(p(35, 39)), 95, 39),
    cyan: bright(style(p(36, 39)), 96, 39),
    white: bright(style(p(37, 39)), 97, 39)
};

module.exports = {
    style,
    styles
};