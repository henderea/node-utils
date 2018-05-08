const _ = require('lodash');
class Args {
    constructor() {
        this._args = null;
        this._flags = {};
        this._defaultOptions = {};
    }

    addFlag(id, names,options = {}) {
        options = _.extend([], options, {acceptsParameter: false, toggle: false, accumulate: false});
        this._flags[id] = {id, names, options};
        return this;
    }

    defaultOptions(defaultOptions) {
        this._defaultOptions = defaultOptions;
        return this;
    }

    parse(argv = process.argv) {
        let args = argv.slice(2);
        let flagIndexes = {};
        _.each(_.values(this._flags), (flag) => {
            let ind = 0;
            let inds = [];
            while(ind >= 0 && ind < (flag.options.acceptsParameter ? args.length - 1 : args.length)) {
                ind = _.findIndex(args, arg => _.includes(flag.names, arg), ind);
                if(ind >= 0 && ind < (flag.options.acceptsParameter ? args.length - 1 : args.length)) {
                    inds = _.concat(inds, ind);
                    ind++;
                }
            }
            if(inds.length > 0) { flagIndexes[flag.id] = inds; }
        });
        let options = this._defaultOptions;
        if(!_.isEmpty(flagIndexes)) {
            let indsToRemove = [];
            _.each(flagIndexes, (inds, id) => {
                let flag = this._flags[id];
                if(flag.options.acceptsParameter) {
                    indsToRemove = _.concat(indsToRemove, _.flatMap(inds, ind => [ind, ind + 1]));
                    if(flag.options.accumulate) {
                        let vals = [];
                        if(options[id] && options[id].length > 0) {
                            vals = options[id];
                        }
                        options[id] = _.concat(vals, _.map(inds, (ind) => args[ind + 1]));
                    } else {
                        options[id] = args[_.last(inds) + 1];
                    }
                } else {
                    indsToRemove = _.concat(indsToRemove, inds);
                    options[id] = !flag.options.toggle || (inds.length % 2) == (options[id] ? 0 : 1);
                }
            });
            _.pullAt(args, _.uniq(indsToRemove));
        }
        const finalArgs = args;
        return {
            options,
            args,
            arg: (() => {
                const f = function(ind = true) {
                    if(ind === true) {
                        return finalArgs;
                    }
                    return finalArgs[ind];
                }
                f.count = finalArgs.length;
                f.all = finalArgs;
                return f;
            })()
        };
    }
}

module.exports = function() { return new Args(); }