var _ = {
    isArray: require('lodash/isArray'),
    map: require('lodash/map'),
    isString: require('lodash/isString')
};
var chalk = require('chalk');
var cliCursor = require('cli-cursor');
var figures = require('figures');
var { map, takeUntil } = require('rxjs/operators');
var Base = require('inquirer/lib/prompts/base');
var observe = require('inquirer/lib/utils/events');
var Paginator = require('inquirer/lib/utils/paginator');
var Choices = require('inquirer/lib/objects/choices');

class GitAddInteractiveCheckboxPrompt extends Base {
    constructor(questions, rl, answers) {
        super(questions, rl, answers);

        if(!this.opt.choices) {
            this.throwParamError('choices');
        }
        if(!this.opt.git) {
            this.throwParamError('git');
        }
        if(!this.opt.createChoices) {
            this.throwParamError('createChoices');
        }

        this.pointer = 0;

        // Make sure no default is set (so it won't be printed)
        this.opt.default = null;

        this.paginator = new Paginator(this.screen);
    }

    /**
     * Start the Inquiry session
     * @param  {Function} cb      Callback when prompt is done
     * @return {this}
     */

    _run(cb) {
        this.done = cb;

        var events = observe(this.rl);

        var validation = this.handleSubmitEvents(
            events.line.pipe(map(this.getCurrentValue.bind(this)))
        );
        validation.success.forEach(this.onEnd.bind(this));
        validation.error.forEach(this.onError.bind(this));

        events.normalizedUpKey
            .pipe(takeUntil(validation.success))
            .forEach(this.onUpKey.bind(this));
        events.normalizedDownKey
            .pipe(takeUntil(validation.success))
            .forEach(this.onDownKey.bind(this));
        events.spaceKey
            .pipe(takeUntil(validation.success))
            .forEach(this.onSpaceKey.bind(this));
        events.aKey.pipe(takeUntil(validation.success)).forEach(this.onAllKey.bind(this));
        events.iKey.pipe(takeUntil(validation.success)).forEach(this.onInverseKey.bind(this));

        // Init the prompt
        cliCursor.hide();
        this.render();
        this.firstRender = false;

        return this;
    }

    /**
     * Render the prompt to screen
     * @return {CheckboxPrompt} self
     */

    render(error) {
        // Render question
        var message = this.getQuestion();
        var bottomContent = '';

        if(!this.spaceKeyPressed) {
            message +=
                '(Press ' +
                chalk.cyan.bold('<space>') +
                ' to select, ' +
                chalk.cyan.bold('<a>') +
                ' to toggle all, ' +
                chalk.cyan.bold('<i>') +
                ' to invert selection)';
        }

        // Render choices or answer depending on the state
        if(this.status !== 'answered') {
            var choicesStr = renderChoices(this.opt.choices, this.pointer);
            var indexPosition = this.opt.choices.indexOf(
                this.opt.choices.getChoice(this.pointer)
            );
            message +=
                '\n' + this.paginator.paginate(choicesStr, indexPosition, this.opt.pageSize || 20);
        }

        if(error) {
            bottomContent = chalk.red('>> ') + error;
        }

        this.screen.render(message, bottomContent);
    }

    /**
     * When user press `enter` key
     */

    onEnd(state) {
        this.status = 'answered';
        this.spaceKeyPressed = true;
        // Rerender prompt (and clean subline error)
        this.render();

        this.screen.done();
        cliCursor.show();
        this.done(state.value);
    }

    onError(state) {
        this.render(state.isValid);
    }

    getCurrentValue() {
        var choices = this.opt.choices.filter(function(choice) {
            return Boolean(choice.checked) && !choice.disabled;
        });

        this.selection = _.map(choices, 'short');
        return _.map(choices, 'value');
    }

    onUpKey() {
        var len = this.opt.choices.realLength;
        this.pointer = this.pointer > 0 ? this.pointer - 1 : len - 1;
        this.render();
    }

    onDownKey() {
        var len = this.opt.choices.realLength;
        this.pointer = this.pointer < len - 1 ? this.pointer + 1 : 0;
        this.render();
    }

    async onSpaceKey() {
        this.spaceKeyPressed = true;
        await this.toggleChoice(this.pointer);
        this.render();
    }

    async onAllKey() {
        var selectAll = Boolean(this.opt.choices.find(choice => choice.type !== 'separator' && !choice.checked));

        var allChoices = this.opt.choices.filter(c => c.type !== 'separator').map(c => c.name);

        if(selectAll) {
            await this.opt.git.add(allChoices);
        } else {
            await this.opt.git.reset(allChoices);
        }

        await this.refreshChoices();

        this.render();
    }

    async refreshChoices() {
        this.opt.choices = new Choices(await this.opt.createChoices(this.opt.git), this.answers);
    }

    async onInverseKey() {
        let toReset = this.opt.choices.filter(c => c.type !== 'separator' && c.checked).map(c => c.name);
        let toAdd = this.opt.choices.filter(c => c.type !== 'separator' && !c.checked).map(c => c.name);
        if(toAdd.length > 0) {
            await this.opt.git.add(toAdd);
        }
        if(toReset.length > 0) {
            await this.opt.git.reset(toReset);
        }

        await this.refreshChoices();

        this.render();
    }

    async toggleChoice(index) {
        var c = this.opt.choices.getChoice(index);
        if(c !== undefined) {
            if(c.checked) {
                await this.opt.git.reset([c.name]);
            } else {
                await this.opt.git.add([c.name]);
            }
            await this.refreshChoices();
        }
    }
}

/**
 * Function for rendering checkbox choices
 * @param  {Number} pointer Position of the pointer
 * @return {String}         Rendered content
 */

function renderChoices(choices, pointer) {
    var output = '';
    var separatorOffset = 0;

    choices.forEach(function(choice, i) {
        if(choice.type === 'separator') {
            separatorOffset++;
            output += ' ' + choice + '\n';
            return;
        }

        if(choice.disabled) {
            separatorOffset++;
            output += ' - ' + choice.name;
            output += ' (' + (_.isString(choice.disabled) ? choice.disabled : 'Disabled') + ')';
        } else {
            var line = getCheckbox(choice.checked) + ' ' + choice.name;
            if(i - separatorOffset === pointer) {
                output += chalk.cyan(figures.pointer + line);
            } else {
                output += ' ' + line;
            }
        }

        output += '\n';
    });

    return output.replace(/\n$/, '');
}

/**
 * Get the checkbox
 * @param  {Boolean} checked - add a X or not to the checkbox
 * @return {String} Composited checkbox string
 */

function getCheckbox(checked) {
    return checked == null ? figures.circleDouble : (checked ? chalk.green(figures.circleFilled) : figures.circle);
}

module.exports = GitAddInteractiveCheckboxPrompt;