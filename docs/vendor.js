(function(FuseBox){FuseBox.$fuse$=FuseBox;
var __process_env__ = {"isProduction":false};
FuseBox.pkg("default", {}, function(___scope___){
});
FuseBox.pkg("fuse-box-css", {}, function(___scope___){
___scope___.file("index.js", function(exports, require, module, __filename, __dirname){

/**
 * Listens to 'async' requets and if the name is a css file
 * wires it to `__fsbx_css`
 */

var runningInBrowser = FuseBox.isBrowser || FuseBox.target === "electron";

var cssHandler = function(__filename, contents) {
    if (runningInBrowser) {
        var styleId = __filename.replace(/[\.\/]+/g, '-');
        if (styleId.charAt(0) === '-') styleId = styleId.substring(1);
        var exists = document.getElementById(styleId);
        if (!exists) {
            //<link href="//fonts.googleapis.com/css?family=Covered+By+Your+Grace" rel="stylesheet" type="text/css">
            var s = document.createElement(contents ? 'style' : 'link');
            s.id = styleId;
            s.type = 'text/css';
            if (contents) {
                s.innerHTML = contents;
            } else {
                s.rel = 'stylesheet';
                s.href = __filename;
            }
            document.getElementsByTagName('head')[0].appendChild(s);
        } else {
            if (contents) {
                exists.innerHTML = contents;
            }
        }
    }
}
if (typeof FuseBox !== "undefined" && runningInBrowser) {
    FuseBox.on('async', function(name) {
        if (/\.css$/.test(name)) {
            cssHandler(name);
            return false;
        }
    });
}

module.exports = cssHandler;
});
return ___scope___.entry = "index.js";
});
FuseBox.pkg("fractal-core", {}, function(___scope___){
___scope___.file("core/index.js", function(exports, require, module, __filename, __dirname){

"use strict";
// core functions
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./module"));
__export(require("./input"));
__export(require("./interface"));
// other functions
__export(require("../utils"));
//# sourceMappingURL=index.js.map
});
___scope___.file("core/module.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const interface_1 = require("./interface");
const input_1 = require("./input");
// a gap is defined with undefined (optional)
exports._ = undefined;
exports.handlerTypes = ['interface', 'task', 'group'];
// create context for a component
function createContext(ctx, name) {
    return {
        id: `${ctx.id}$${name}`,
        name,
        groups: {},
        // delegation
        rootCtx: ctx.rootCtx,
        global: ctx.global,
        hotSwap: ctx.hotSwap,
        components: ctx.components,
        groupHandlers: ctx.groupHandlers,
        interfaceHandlers: ctx.interfaceHandlers,
        taskHandlers: ctx.taskHandlers,
        beforeInput: ctx.beforeInput,
        afterInput: ctx.afterInput,
        warn: ctx.warn,
        error: ctx.error,
    };
}
exports.createContext = createContext;
// add a component to the component index
exports.nest = (ctx) => async (name, component, isStatic = false) => {
    // create the global object for initialization
    ctx.global = {
        initialized: false,
        render: true,
    };
    let childCtx = await _nest(ctx, name, component, isStatic);
    // init lifecycle hooks: init all descendant components
    if (!ctx.hotSwap) {
        await initAll(childCtx);
    }
    childCtx.global.initialized = true;
    return childCtx;
};
// init all descendant components
async function initAll(ctx) {
    let space = ctx.components[ctx.id];
    if (space.def.init) {
        await space.def.init(input_1.makeInputHelpers(ctx));
    }
    let childName;
    for (childName in space.components) {
        await initAll(ctx.components[ctx.id + '$' + childName].ctx);
    }
}
/* istanbul ignore next */
async function _nest(ctx, name, component, isStatic = false) {
    // namespaced name if is a child
    let id = ctx.id === '' ? name : ctx.id + '$' + name;
    if (ctx.components[id]) {
        ctx.warn('nest', `component '${ctx.id}' has overwritten component space '${id}'`);
    }
    if (ctx.components[ctx.id] && !ctx.components[ctx.id].components[name]) {
        ctx.components[ctx.id].components[name] = true;
    }
    let childCtx;
    if (ctx.id === '') {
        childCtx = ctx;
        ctx.id = name;
    }
    else {
        childCtx = createContext(ctx, name);
    }
    ctx.components[id] = {
        ctx: childCtx,
        isStatic,
        // if state is an object, it is cloned
        state: typeof component.state === 'object' ? clone(component.state) : component.state,
        inputs: {},
        interfaces: _makeInterfaces(childCtx, component.interfaces),
        interfaceValues: {},
        components: clone(component.components || {}),
        def: component,
    };
    if (component.inputs) {
        ctx.components[id].inputs = component.inputs(input_1.makeInputHelpers(childCtx));
    }
    else {
        ctx.components[id].inputs = {};
    }
    if (component.actions) {
        if (!ctx.components[id].inputs['action']) {
            // action helper enabled by default
            ctx.components[id].inputs['action'] = exports.action(component.actions);
        }
        if (!ctx.components[id].inputs['return']) {
            // action helper enabled by default
            ctx.components[id].inputs['return'] = x => x;
        }
    }
    // composition
    if (component.components) {
        await exports.nestAll(childCtx)(component.components, isStatic);
    }
    if (component.groups) {
        // Groups are handled automatically only when comoponent are initialized
        await handleGroups(childCtx, component);
    }
    return childCtx;
}
function _makeInterfaces(ctx, interfaces) {
    let index = {};
    let name;
    for (name in interfaces) {
        index[name] = interfaces[name](interface_1.makeInterfaceHelpers(ctx));
    }
    return index;
}
async function handleGroups(ctx, component) {
    let space;
    let name;
    for (name in component.groups) {
        space = ctx.groupHandlers[name];
        if (space) {
            await space.handle([ctx.id, component.groups[name]]);
        }
        else {
            ctx.error('nest', `module has no group handler for '${name}' of component '${component.name}' from space '${ctx.id}'`);
        }
    }
}
// add many components to the component index
/* istanbul ignore next */
exports.nestAll = (ctx) => async (components, isStatic = false) => {
    let name;
    for (name in components) {
        await _nest(ctx, name, components[name], isStatic);
    }
};
// remove a component to the component index, if name is not defined dispose the root
exports.unnest = (ctx) => name => {
    let id = name !== undefined ? ctx.id + '$' + name : ctx.id;
    let componentSpace = ctx.components[id];
    /* istanbul ignore next */
    if (!componentSpace) {
        return ctx.error('unnest', `there is no component with name '${name}' at component '${ctx.id}'`);
    }
    if (name !== undefined) {
        delete ctx.components[ctx.id].components[name];
    }
    // decomposition
    let components = componentSpace.components;
    /* istanbul ignore else */
    if (components) {
        exports.unnestAll(ctx.components[id].ctx)(Object.keys(components));
    }
    // lifecycle hook: destroy
    if (componentSpace.def.destroy) {
        componentSpace.def.destroy(input_1.makeInputHelpers(ctx.components[id].ctx));
    }
    delete ctx.components[id];
};
// add many components to the component index
exports.unnestAll = (ctx) => components => {
    let _unnest = exports.unnest(ctx);
    for (let i = 0, len = components.length; i < len; i++) {
        _unnest(components[i]);
    }
};
async function propagate(ctx, inputName, data) {
    // notifies parent if name starts with $
    let id = ctx.id;
    let idParts = (id + '').split('$');
    let componentSpace = ctx.components[id];
    if (idParts.length > 1) {
        // is not root?
        let parentId = idParts.slice(0, -1).join('$');
        let parentSpace = ctx.components[parentId];
        let parentInputName;
        parentInputName = `$${componentSpace.ctx.name}_${inputName}`;
        /* istanbul ignore else */
        if (parentSpace.inputs[parentInputName]) {
            await exports.toIt(parentSpace.ctx)(parentInputName, data);
        }
        parentInputName = `$$${componentSpace.def.name}_${inputName}`;
        /* istanbul ignore else */
        if (parentSpace.inputs[parentInputName]) {
            await exports.toIt(parentSpace.ctx)(parentInputName, [componentSpace.ctx.name, data]);
        }
        parentInputName = `$_${inputName}`;
        /* istanbul ignore else */
        if (parentSpace.inputs[parentInputName]) {
            await exports.toIt(parentSpace.ctx)(parentInputName, [componentSpace.ctx.name, data, componentSpace.def.name]);
        }
    }
}
exports.propagate = propagate;
// send a message to an input of a component from itself
// There area a weird behaviuor in istanbul coverage
/* istanbul ignore next */
exports.toIt = (ctx) => {
    let id = ctx.id;
    let componentSpace = ctx.components[id];
    return async (inputName, data, isPropagated = true) => {
        let input = componentSpace.inputs[inputName];
        if (input === undefined) {
            ctx.error('execute', `there are no input named '${inputName}' in component '${componentSpace.def.name}' from space '${id}'`);
            return;
        }
        ctx.beforeInput(ctx, inputName, data);
        if (input && input !== 'nothing') {
            // call the input
            let executable = await input(data);
            try {
                execute(ctx, executable);
                /* istanbul ignore else */
                if (isPropagated && ctx.components[id]) {
                    await propagate(ctx, inputName, data);
                }
                await ctx.afterInput(ctx, inputName, data);
            }
            catch (err) {
                ctx.error('execute input', `Error in input '${inputName}' of component '${componentSpace.def.name}' from space '${id}'`);
            }
        }
    };
};
// execute an executable in a context, executable parameter should not be undefined
async function execute(ctx, executable) {
    let id = ctx.id;
    let componentSpace = ctx.components[id];
    if (typeof executable === 'function') {
        // single update
        componentSpace.state = executable(componentSpace.state);
        /* istanbul ignore else */
        if (ctx.global.initialized && ctx.global.render) {
            calcAndNotifyInterfaces(ctx); // root context
        }
    }
    else {
        /* istanbul ignore else */
        if (executable instanceof Array) {
            if (executable[0] && typeof executable[0] === 'string') {
                // single task
                if (!ctx.taskHandlers[executable[0]]) {
                    return ctx.error('execute', `there are no task handler for '${executable[0]}' in component '${componentSpace.def.name}' from space '${id}'`);
                }
                await ctx.taskHandlers[executable[0]].handle(executable[1]);
            }
            else {
                /* istanbul ignore else */
                if (executable[0] instanceof Array || typeof executable[0] === 'function') {
                    // list of updates and tasks
                    for (let i = 0, len = executable.length; i < len; i++) {
                        if (typeof executable[i] === 'function') {
                            // perform the update
                            componentSpace.state = executable[i](componentSpace.state);
                            /* istanbul ignore else */
                            if (ctx.global.initialized && ctx.global.render) {
                                calcAndNotifyInterfaces(ctx); // root context
                            }
                        }
                        else {
                            /* istanbul ignore else */
                            if (executable[i] instanceof Array && typeof executable[i][0] === 'string') {
                                // single task
                                if (!ctx.taskHandlers[executable[i][0]]) {
                                    return ctx.error('execute', `there are no task handler for '${executable[i][0]}' in component '${componentSpace.def.name}' from space '${id}'`);
                                }
                                ctx.taskHandlers[executable[i][0]].handle(executable[i][1]);
                            }
                        }
                        // the else branch never occurs because of Typecript check
                    }
                }
            }
        }
        // the else branch never occurs because of Typecript check
    }
}
exports.execute = execute;
function calcAndNotifyInterfaces(ctx) {
    // calc and caches interfaces
    let space = ctx.components[ctx.id];
    let idParts = (ctx.id + '').split('$');
    idParts.pop();
    for (let name in space.interfaces) {
        setTimeout(async () => {
            space.interfaceValues[name] = await space.interfaces[name](space.state);
            // remove cache of parent component spaces
            let parts = idParts.slice(0);
            for (let i = parts.length - 1; i >= 0; i--) {
                ctx.components[parts.join('$')].interfaceValues[name] = undefined;
                parts.pop();
            }
            await notifyInterfaceHandlers(ctx);
        }, 0);
    }
}
exports.calcAndNotifyInterfaces = calcAndNotifyInterfaces;
// permorms interface recalculation
async function notifyInterfaceHandlers(ctx) {
    let space = ctx.components[ctx.rootCtx.id];
    for (let name in space.interfaces) {
        if (ctx.interfaceHandlers[name]) {
            ctx.interfaceHandlers[name].handle(await space.interfaces[name](space.state));
        }
        else {
            // This only can happen when this method is called for a context that is not the root
            ctx.error('notifyInterfaceHandlers', `module does not have interface handler named '${name}' for component '${space.def.name}' from space '${ctx.id}'`);
        }
    }
}
exports.notifyInterfaceHandlers = notifyInterfaceHandlers;
// function for running a root component
async function run(moduleDef) {
    // internal module state
    // root component
    let component;
    let moduleAPI;
    // root context
    let ctx;
    // attach root component
    async function attach(comp, lastComponents, middleFn) {
        // root component, take account of hot swapping
        component = comp ? comp : moduleDef.root;
        let rootName = component.name;
        // if is hot swapping, do not recalculat context
        if (!lastComponents) {
            // root context
            ctx = {
                id: '',
                name: rootName,
                groups: {},
                global: {
                    initialized: false,
                    render: moduleDef.render,
                },
                hotSwap: false,
                // component index
                components: {},
                groupHandlers: {},
                taskHandlers: {},
                interfaceHandlers: {},
                // error and warning handling
                beforeInput: (ctxIn, inputName, data) => {
                    /* istanbul ignore else */
                    if (moduleDef.beforeInput) {
                        moduleDef.beforeInput(ctxIn, inputName, data);
                    }
                },
                afterInput: (ctxIn, inputName, data) => {
                    /* istanbul ignore else */
                    if (moduleDef.afterInput) {
                        moduleDef.afterInput(ctxIn, inputName, data);
                    }
                },
                warn: (source, description) => {
                    /* istanbul ignore else */
                    if (moduleDef.warn) {
                        moduleDef.warn(source, description);
                    }
                },
                error: (source, description) => {
                    /* istanbul ignore else */
                    if (moduleDef.error) {
                        moduleDef.error(source, description);
                    }
                },
            };
            ctx.rootCtx = ctx; // nice right? :)
        }
        else {
            // hot swaping mode preserves root context, but restore id to '' because this way merge knows is root context
            ctx.id = '';
        }
        // API for modules
        moduleAPI = {
            // dispatch function type used for handlers
            dispatch: (eventData) => interface_1.dispatch(ctx, eventData),
            dispose,
            reattach,
            // merge a component to the component index
            nest: exports.nest(ctx),
            // merge many components to the component index
            nestAll: exports.nestAll(ctx),
            // unnest a component to the component index
            unnest: exports.unnest(ctx),
            // unnest many components to the component index
            unnestAll: exports.unnestAll(ctx),
            // set a space of a certain component
            setGroup: (id, name, space) => {
                ctx.components[id].ctx.groups[name] = space;
            },
            // delegated methods
            warn: ctx.warn,
            error: ctx.error,
        };
        // module lifecycle hook: init
        if (moduleDef.beforeInit && !middleFn) {
            moduleDef.beforeInit(moduleAPI);
        }
        // if is not hot swapping
        if (!lastComponents) {
            // pass ModuleAPI to every Interface, Task and Space HandlerFunction
            let handlers;
            for (let c = 0, len = exports.handlerTypes.length; c < len; c++) {
                handlers = moduleDef[exports.handlerTypes[c] + 's'];
                if (handlers) {
                    let name;
                    for (name in handlers) {
                        ctx[exports.handlerTypes[c] + 'Handlers'][name] = await handlers[name](moduleAPI);
                    }
                }
            }
        }
        if (middleFn) {
            ctx.hotSwap = true;
        }
        // merges main component and ctx.id now contains it name
        ctx = await exports.nest(ctx)(component.name, component, true);
        let rootSpace = ctx.components[ctx.id];
        // middle function for hot-swapping
        if (middleFn) {
            ctx.components = middleFn(ctx, ctx.components, lastComponents);
            let id;
            for (id in ctx.components) {
                if (!ctx.components[id].isStatic) {
                    await handleGroups(ctx.components[id].ctx, ctx.components[id].def);
                }
            }
        }
        // pass initial value to each Interface Handler
        // -- interfaceOrder
        let interfaceOrder = moduleDef.interfaceOrder;
        let name;
        let errorNotHandler = name => ctx.error('InterfaceHandlers', `'${rootName}' component has no interface called '${name}', missing interface handler`);
        if (interfaceOrder) {
            for (let i = 0; name = interfaceOrder[i]; i++) {
                if (ctx.interfaceHandlers[name]) {
                    ctx.interfaceHandlers[name].handle(rootSpace.interfaces[name](ctx.components[rootName].state));
                }
                else {
                    return errorNotHandler(name);
                }
            }
        }
        for (name in rootSpace.interfaces) {
            if (interfaceOrder && interfaceOrder.indexOf(name) !== -1) {
                continue; // interface evaluated yet
            }
            if (ctx.interfaceHandlers[name]) {
                ctx.interfaceHandlers[name].handle(await rootSpace.interfaces[name](ctx.components[rootName].state));
            }
            else {
                return errorNotHandler(name);
            }
        }
        // module lifecycle hook: init
        if (moduleDef.init && !middleFn) {
            moduleDef.init(moduleAPI);
        }
    }
    await attach(undefined);
    function dispose() {
        if (moduleDef.destroy) {
            moduleDef.destroy(moduleAPI);
        }
        // dispose all handlers
        let handlers;
        for (let c = 0, len = exports.handlerTypes.length; c < len; c++) {
            handlers = ctx[`${exports.handlerTypes[c]}Handlers`];
            let name;
            for (name in handlers) {
                handlers[name].dispose();
            }
        }
        exports.unnest(ctx)();
        ctx = undefined;
        this.isDisposed = true;
    }
    async function reattach(comp, middleFn) {
        let lastComponents = ctx.components;
        ctx.components = {};
        await attach(comp, lastComponents, middleFn);
    }
    return {
        moduleDef,
        // reattach root component, used for hot swapping
        isDisposed: false,
        // related to internals
        groupHandlers: ctx.groupHandlers,
        interfaceHandlers: ctx.interfaceHandlers,
        taskHandlers: ctx.taskHandlers,
        // root context
        moduleAPI,
        ctx,
    };
}
exports.run = run;
// generic action input
exports.action = (actions) => async ([arg1, arg2]) => {
    let name;
    let value;
    if (arg1 instanceof Array) {
        name = arg1[0];
        value = arg1[1];
        if (arg2 !== undefined) {
            // add fetch value
            // TODO: test it!!
            value = (value !== undefined) ? [value, arg2] : arg2;
        }
    }
    else {
        name = arg1;
        value = arg2;
    }
    return actions[name](value);
};
function clone(o) {
    var out, v, key;
    out = Array.isArray(o) ? [] : {};
    for (key in o) {
        v = o[key];
        out[key] = (typeof v === "object") ? clone(v) : v;
    }
    return out;
}
exports.clone = clone;
//# sourceMappingURL=module.js.map
});
___scope___.file("core/interface.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const module_1 = require("./module");
const input_1 = require("./input");
exports.makeInterfaceHelpers = (ctx) => ({
    ctx,
    interfaceOf: exports._interfaceOf(ctx),
    stateOf: input_1._stateOf(ctx),
    ev: exports._ev(ctx),
    act: exports._act(ctx),
    vw: exports._vw(ctx),
    vws: exports._vws(ctx),
});
// gets an interface message from a certain component
exports._interfaceOf = (ctx) => (name, interfaceName) => {
    let id = `${ctx.id}$${name}`;
    let componentSpace = ctx.components[id];
    if (!componentSpace) {
        ctx.error('interfaceOf', `there are no component space '${id}'`);
        return {};
    }
    if (!componentSpace.def.interfaces[interfaceName]) {
        ctx.error('interfaceOf', `there are no interface '${interfaceName}' in component '${componentSpace.def.name}' from space '${id}'`);
        return {};
    }
    // search in interface cache
    let cache = componentSpace.interfaceValues[interfaceName];
    if (cache) {
        return cache;
    }
    else {
        // caches interface
        componentSpace.interfaceValues[interfaceName] = componentSpace.interfaces[interfaceName](componentSpace.state);
        return componentSpace.interfaceValues[interfaceName];
    }
};
// generic action dispatcher
exports._act = (ctx) => {
    let _evCtx = exports._ev(ctx);
    return (actionName, context, param, options) => _evCtx('action', [actionName, context], param, options);
};
// extract component view interface, sintax sugar
exports._vw = (ctx) => {
    let _interfaceOfCtx = exports._interfaceOf(ctx);
    return componentName => _interfaceOfCtx(componentName, 'view');
};
// extract view interfaces from a component group
exports._vws = (ctx) => {
    let _interfaceOfCtx = exports._interfaceOf(ctx);
    let comps = input_1._componentHelpers(ctx);
    return groupName => {
        let views = [];
        let componentNames = comps(groupName).getNames();
        for (let i = 0, len = componentNames.length; i < len; i++) {
            views.push(_interfaceOfCtx(componentNames[i], 'view'));
        }
        return views;
    };
};
// create an InputData array
exports._ev = (ctx) => (inputName, context, param, options) => {
    return [ctx.id, inputName, context, param, options];
};
function computePath(path, event) {
    let data;
    let actual = event;
    for (let i = 0, len = path.length; i < len; i++) {
        if (path[i] instanceof Array) {
            data = {};
            let keys = path[i];
            for (let i = 0, len = keys.length; i < len; i++) {
                data[keys[i]] = actual[keys[i]];
            }
        }
        else {
            actual = actual[path[i]];
        }
    }
    if (!data) {
        data = actual;
    }
    return data;
}
function computeEvent(event, iData) {
    let data;
    if (iData[3] === '*') {
        // serialize the whole object (note that DOM events are not serializable, use paths instead)
        data = JSON.parse(JSON.stringify(event));
    }
    else if (event && iData[3] !== undefined) {
        // have fetch parameter
        if (iData[3] instanceof Array) {
            // fetch parameter is a path, e.g. ['target', 'value']
            let param = iData[3];
            if (param[1] && param[1] instanceof Array) {
                data = [];
                for (let i = 0, len = param.length; i < len; i++) {
                    data[i] = computePath(param[i], event);
                }
            }
            else {
                // only one path
                data = computePath(param, event);
            }
        }
        else {
            // fetch parameter is only a getter, e.g. 'target'
            data = event[iData[3]];
        }
    }
    if (iData[2] === undefined && iData[3] === undefined) {
        return [iData[0], iData[1]]; // dispatch an input with no arguments
    }
    return [
        iData[0],
        iData[1],
        iData[2],
        data,
        iData[2] !== undefined && iData[3] !== undefined
            ? 'pair'
            : (iData[2] !== undefined)
                ? 'context'
                : 'fn',
    ];
}
exports.computeEvent = computeEvent;
// dispatch an input based on eventData to the respective component
/* istanbul ignore next */
// TODO: optimize via currification
exports.dispatch = async (ctxIn, eventData, isPropagated = true) => {
    let id = eventData[0] + '';
    // root component
    let ctx = ctxIn.components[(id + '').split('$')[0]].ctx;
    let componentSpace = ctx.components[id];
    if (!componentSpace) {
        return ctx.error('dispatch', `there are no component space '${id}'`);
    }
    let inputName = eventData[1];
    // extract data from eventData
    let data = eventData[4] === 'pair' // is both?
        ? [eventData[2], eventData[3]] // is both event data + context
        : eventData[4] === 'context'
            ? eventData[2] // is only context
            : eventData[3]; // is only event data
    await module_1.toIt(componentSpace.ctx)(inputName, data, isPropagated);
};
//# sourceMappingURL=interface.js.map
});
___scope___.file("core/input.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const interface_1 = require("./interface");
const module_1 = require("./module");
exports.makeInputHelpers = (ctx) => ({
    ctx,
    ev: interface_1._ev(ctx),
    act: interface_1._act(ctx),
    stateOf: exports._stateOf(ctx),
    toIt: module_1.toIt(ctx),
    toChild: exports.toChild(ctx),
    toAct: exports.toAct(ctx),
    runIt: exports.runIt(ctx),
    nest: module_1.nest(ctx),
    unnest: module_1.unnest(ctx),
    nestAll: module_1.nestAll(ctx),
    unnestAll: module_1.unnestAll(ctx),
    comps: exports._componentHelpers(ctx),
});
exports._stateOf = (ctx) => name => {
    let id = name ? ctx.id + '$' + name : ctx.id;
    let space = ctx.components[id];
    if (space) {
        return space.state;
    }
    else {
        ctx.error('stateOf', name
            ? `there are no child '${name}' in space '${ctx.id}'`
            : `there are no space '${id}'`);
    }
};
// send a message to an input of a component from its parent
exports.toChild = (ctx) => async (name, inputName, msg = undefined, isAsync = false, isPropagated = true) => {
    let childId = ctx.id + '$' + name;
    let space = ctx.components[childId];
    if (space) {
        await module_1.toIt(space.ctx)(inputName, msg, isPropagated);
    }
    else {
        ctx.error('toChild', `there are no child '${name}' in space '${ctx.id}'`);
    }
};
// generic action self caller
exports.toAct = (ctx) => {
    let _toIt = module_1.toIt(ctx);
    return (actionName, data, isPropagated = true) => _toIt('action', [actionName, data], isPropagated);
};
// generic action self caller
exports.runIt = (ctx) => {
    let _toIt = module_1.toIt(ctx);
    return (executables, isPropagated = true) => _toIt('return', executables, isPropagated);
};
exports.getName = (name) => name.split('_')[1];
exports._componentHelpers = (ctx) => {
    let _toChild = exports.toChild(ctx);
    let stateOf = exports._stateOf(ctx);
    return groupName => {
        let componentNames = Object.keys(ctx.components[ctx.id].components)
            .filter(name => name.split('_')[0] === groupName);
        return {
            getState(key, options) {
                let obj = {};
                let name;
                let exceptions = options && options.exceptions;
                let nameFn = options && options.nameFn;
                for (let i = 0, len = componentNames.length; i < len; i++) {
                    if (exceptions && exceptions.indexOf(componentNames[i]) === -1 || !exceptions) {
                        name = exports.getName(componentNames[i]);
                        name = nameFn ? nameFn(name) : name;
                        obj[name] = stateOf(componentNames[i])[key];
                    }
                }
                return obj;
            },
            executeAll(insts) {
                for (let i = 0, inst; inst = insts[i]; i++) {
                    _toChild(groupName + '_' + inst[0], inst[1], inst[2]);
                }
            },
            broadcast(inputName, data) {
                for (let i = 0, name; name = componentNames[i]; i++) {
                    _toChild(name, inputName, data);
                }
            },
            getNames() {
                return componentNames;
            }
        };
    };
};
//# sourceMappingURL=input.js.map
});
___scope___.file("utils/index.js", function(exports, require, module, __filename, __dirname){

"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./component"));
__export(require("./fun"));
__export(require("./log"));
__export(require("./reattach"));
__export(require("./style"));
__export(require("./worker"));
//# sourceMappingURL=index.js.map
});
___scope___.file("utils/component.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../core");
// set of helpers for building components
// send a message to an input of a component from outside a Module
/* istanbul ignore next */
async function sendMsg(mod, id, inputName, msg, isPropagated = true) {
    let ctx = mod.ctx;
    await core_1.toIt(ctx.components[id].ctx)(inputName, msg, isPropagated);
}
exports.sendMsg = sendMsg;
function setGroup(name, group) {
    return function (comp) {
        comp.groups[name] = group;
        return comp;
    };
}
exports.setGroup = setGroup;
function spaceOf(ctx) {
    return ctx.components[ctx.id];
}
exports.spaceOf = spaceOf;
// make a new component from another merging her state
function props(state) {
    return function (comp) {
        if (comp.state !== null && typeof comp.state === 'object'
            && state !== null && typeof state === 'object') {
            comp.state = Object.assign(comp.state, state);
        }
        else {
            comp.state = state;
        }
        return comp;
    };
}
exports.props = props;
function styles(style) {
    return function (comp) {
        comp.groups.style = core_1.mergeStyles(comp.groups.style, style);
        return comp;
    };
}
exports.styles = styles;
exports.compGroup = (groupName, arr, fn) => arr.reduce((comps, c) => {
    comps[groupName + '_' + c[0]] = fn(c[1]);
    return comps;
}, {});
//# sourceMappingURL=component.js.map
});
___scope___.file("utils/fun.js", function(exports, require, module, __filename, __dirname){

"use strict";
// -- Functional functions (just fun)
// Use them for building actions in a declarative and concise way
Object.defineProperty(exports, "__esModule", { value: true });
exports.assoc = (key) => (value) => obj => {
    obj[key] = value;
    return obj;
};
exports.evolve = (index) => obj => {
    for (let key in index) {
        obj[key] = index[key](obj[key]);
    }
    return obj;
};
exports.evolveKey = (key) => (fn) => obj => {
    obj[key] = fn(obj[key]);
    return obj;
};
// pipe allows to pipe functions (left composing)
function pipe(...args) {
    return function (value) {
        let result = value;
        for (let i = 0, len = args.length; i < len; i++) {
            result = args[i](result);
        }
        return result;
    };
}
exports.pipe = pipe;
function mapToObj(arr, fn) {
    let result = {}, aux;
    for (let i = 0, len = arr.length; i < len; i++) {
        aux = fn(i, arr[i]);
        result[aux[0]] = aux[1];
    }
    return result;
}
exports.mapToObj = mapToObj;
function merge(objSrc) {
    return function (obj) {
        let key;
        for (key in objSrc) {
            obj[key] = objSrc[key];
        }
        return obj;
    };
}
exports.merge = merge;
const _deepmerge = require("deepmerge/dist/umd");
exports.deepmerge = _deepmerge;
exports.deepmergeAll = _deepmerge.all;
//# sourceMappingURL=fun.js.map
});
___scope___.file("utils/log.js", function(exports, require, module, __filename, __dirname){

"use strict";
// side effects for log functionality
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../core");
/* istanbul ignore next */
exports.warn = (source, description) => console.warn(`source: ${source}, description: ${description}`);
/* istanbul ignore next */
exports.error = (source, description) => console.error(`source: ${source}, description: ${description}`);
/* istanbul ignore next */
exports.beforeInput = (ctx, inputName, data) => {
    let state = core_1._stateOf(ctx)();
    if (typeof state === 'object') {
        state = core_1.clone(state);
    }
    // <any> until groupCollapsed issue in TS repo is merged https://github.com/Microsoft/TypeScript/pull/15630
    ;
    console.groupCollapsed(`%c input %c${inputName} %cfrom %c${ctx.id}`, 'color: #626060; font-size: 12px;', 'color: #3b3a3a; font-size: 14px;', 'color: #626060; font-size: 12px;', 'color: #3b3a3a; font-size: 14px;');
    console.info('%c input data  ', 'color: rgb(9, 157, 225); font-weight: bold;', data);
    console.info('%c prev state  ', 'color: #AFAFAF; font-weight: bold;', state);
};
// color for actions (not yet implemented) #58C6F8
/* istanbul ignore next */
exports.afterInput = (ctx, inputName, data) => {
    let state = core_1._stateOf(ctx)();
    if (typeof state === 'object') {
        state = core_1.clone(state);
    }
    console.info('%c next state  ', 'color: #3CA43F; font-weight: bold;', state);
    console.groupEnd();
};
exports.logFns = {
    warn: exports.warn,
    error: exports.error,
    beforeInput: exports.beforeInput,
    afterInput: exports.afterInput,
};
//# sourceMappingURL=log.js.map
});
___scope___.file("utils/reattach.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const deepEqual = require("deep-equal");
/* this function take an initial state, modified state and new state
  make a plan diff of initial and new. next apply changes to modified
*/
function mergeStates(ctx, components, // new components
    lastComponents // old components
) {
    let comps = {};
    let ids = Object.keys(components);
    // add dynamic components to mergeable components
    for (let i = 0, lastIds = Object.keys(lastComponents), len = lastIds.length; i < len; i++) {
        if (!lastComponents[lastIds[i]].isStatic) {
            ids.push(lastIds[i]);
        }
    }
    for (let i = 0, len = ids.length; i < len; i++) {
        let newComp = components[ids[i]];
        let lastComp = lastComponents[ids[i]];
        // resulting component
        comps[ids[i]] = newComp;
        // if the component still existing
        if (newComp) {
            // if not is a new state of a component
            if (lastComp) {
                // if the new component state is an object
                if (typeof newComp.state === 'object') {
                    for (let j = 0, keys = Object.keys(lastComp.state), len = keys.length; j < len; j++) {
                        // compare old definition and new state deeply, if equal let the modified old state
                        if (deepEqual(newComp.state[keys[j]], lastComp.def.state[keys[j]])) {
                            comps[ids[i]].state[keys[j]] = lastComp.state[keys[j]];
                        }
                    }
                }
                else {
                    /* istanbul ignore else */
                    if (newComp.state === lastComp.def.state) {
                        comps[ids[i]].state = lastComp.state;
                    }
                }
            }
        }
        else {
            /* istanbul ignore else */
            if (!lastComp.isStatic) {
                // add dynamic components
                comps[ids[i]] = lastComp;
            }
        }
    }
    for (let i = 0, ids = Object.keys(comps), len = ids.length; i < len; i++) {
        // replace component in contexts of spaces
        comps[ids[i]].ctx.components = comps;
        if (!comps[ids[i]].isStatic) {
            // replace outdated defs of dynamic components
            let idParts = ids[i].split('$');
            // is not root?
            /* istanbul ignore else */
            if (idParts.length > 1) {
                let parentId = idParts.slice(0, -1).join('$');
                if (components[parentId]) {
                    if (components[parentId].def.defs && components[parentId].def.defs[comps[ids[i]].def.name]) {
                        comps[ids[i]].def = components[parentId].def.defs[comps[ids[i]].def.name];
                    }
                    else {
                        ctx.error('mergeStates', `there are no dynamic component definition of ${comps[ids[i]].def.name} (defs) in ${parentId}`);
                    }
                }
                else {
                    if (comps[parentId].def.defs && comps[parentId].def.defs[comps[ids[i]].def.name]) {
                        comps[ids[i]].def = comps[parentId].def.defs[comps[ids[i]].def.name];
                    }
                    else {
                        ctx.error('mergeStates', `there are no dynamic component definition of ${comps[ids[i]].def.name} (defs) in ${parentId}`);
                    }
                }
            }
        }
    }
    return comps;
}
exports.mergeStates = mergeStates;
//# sourceMappingURL=reattach.js.map
});
___scope___.file("utils/style.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typestyle_1 = require("typestyle");
const fun_1 = require("./fun");
const index_1 = require("../interfaces/view/index");
exports.getStyles = typestyle_1.getStyles;
/* istanbul ignore next */
function styleGroup(instance, stylesObj, moduleName) {
    let classes = {};
    for (let key in stylesObj) {
        if (moduleName !== undefined) {
            classes[key] = instance.style(stylesObj[key], { $debugName: `_${moduleName}_${key}__` });
        }
        else {
            classes[key] = instance.style(stylesObj[key]);
        }
    }
    return classes;
}
exports.styleGroup = styleGroup;
/* istanbul ignore next */
function hasBaseObject(obj) {
    for (let key in obj) {
        if (obj[key] !== null && typeof obj[key] === 'object' && key == 'base') {
            return true;
        }
    }
    return false;
}
exports.hasBaseObject = hasBaseObject;
// function for ngClass with one dynamic property
/* istanbul ignore next */
function c(className, condition) {
    return {
        [className]: condition,
    };
}
exports.c = c;
/* istanbul ignore next */
function mergeStyles(group1, group2) {
    let mergedGroup = { base: {} };
    for (let i = 0, keys = Object.keys(group1), len = keys.length; i < len; i++) {
        mergedGroup[keys[i]] = group1[keys[i]];
    }
    for (let i = 0, keys = Object.keys(group2), len = keys.length; i < len; i++) {
        if (mergedGroup[keys[i]] && typeof mergedGroup[keys[i]] === 'object') {
            mergedGroup[keys[i]] = fun_1.deepmerge(mergedGroup[keys[i]], group2[keys[i]]);
        }
        else {
            mergedGroup[keys[i]] = group2[keys[i]];
        }
    }
    return mergedGroup;
}
exports.mergeStyles = mergeStyles;
/* istanbul ignore next */
exports.placeholderColor = (color) => ({
    $nest: {
        '&::-webkit-input-placeholder': {
            $unique: true,
            color: color,
        },
        '&:placeholder-shown': {
            $unique: true,
            color: color,
        },
        '&:-ms-input-placeholder': {
            $unique: true,
            color: color,
        },
    },
});
exports.absoluteCenter = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};
exports.clickable = {
    cursor: 'pointer',
    userSelect: 'none',
    '-moz-user-select': 'none',
};
exports.obfuscator = {
    position: 'absolute',
    top: '0px',
    left: '0px',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'none',
};
/* istanbul ignore next */
exports.iconView = (iconName, options = {}) => index_1.h('svg', fun_1.deepmerge({ class: { ['svg_' + iconName]: true } }, options), [
    index_1.h('use', { attrs: { 'xlink:href': 'assets/icons-bundle.min.svg#' + iconName } }),
]);
//# sourceMappingURL=style.js.map
});
___scope___.file("interfaces/view/index.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const snabbdom_1 = require("snabbdom");
const class_1 = require("snabbdom/modules/class");
const attributes_1 = require("snabbdom/modules/attributes");
const props_1 = require("snabbdom/modules/props");
const style_1 = require("snabbdom/modules/style");
const eventListeners_1 = require("./eventListeners");
const globalListeners_1 = require("./globalListeners");
const sizeBinding_1 = require("./sizeBinding");
const h_1 = require("./h");
exports.h = h_1.default;
/* istanbul ignore next */
exports.viewHandler = (selectorElm, cb) => (mod) => {
    let selector = (typeof selectorElm === 'string') ? selectorElm : '';
    let state = {
        lastContainer: undefined,
    };
    // Common snabbdom patch function (convention over configuration)
    let patchFn = snabbdom_1.init([
        class_1.default,
        attributes_1.default,
        props_1.default,
        style_1.default,
        eventListeners_1.default(mod),
        globalListeners_1.default(mod, state),
        sizeBinding_1.default(mod),
    ]);
    function handler(vnode) {
        let vnode_mapped = exports.h('div' + selector, { key: selector }, [vnode]);
        state.lastContainer = patchFn(state.lastContainer, vnode_mapped);
    }
    return {
        state,
        handle: async (value) => {
            if (typeof window === 'undefined') {
                if (cb) {
                    cb(value);
                }
                return;
            }
            if (!state.lastContainer) {
                let container = selector !== '' ? document.querySelector(selector) : selectorElm;
                if (!container) {
                    return mod.error('view', `There are no element matching selector '${selector}'`);
                }
                state.lastContainer = container;
                handler(state.lastContainer);
                handler(value);
            }
            else {
                handler(value);
            }
            if (cb) {
                cb(value);
            }
        },
        dispose: () => { },
    };
};
//# sourceMappingURL=index.js.map
});
___scope___.file("interfaces/view/eventListeners.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../../core");
/* istanbul ignore next */
exports.eventListenersModule = (mod) => {
    function invokeHandler(handler, event) {
        if (handler instanceof Array && typeof handler[0] === 'string') {
            let options = handler[4];
            if ((options && options.listenPrevented !== true || !options) && event.defaultPrevented) {
                return;
            }
            if (options && options.default === false) {
                event.preventDefault();
            }
            setTimeout(() => {
                mod.dispatch(core_1.computeEvent(event, handler));
            }, 0);
        }
        else if (handler instanceof Array) {
            // call multiple handlers
            for (var i = 0; i < handler.length; i++) {
                invokeHandler(handler[i], event);
            }
        }
        else if (handler === 'ignore') {
            // this handler is ignored
            event.preventDefault();
        }
        else if (handler === '' && handler === undefined) {
            // this handler is passed
            return;
        }
        else {
            mod.error('ViewInterface-eventListenersModule', 'event handler of type ' + typeof handler + 'are not allowed, data: ' + JSON.stringify(handler));
        }
    }
    function handleEvent(event, vnode) {
        var name = event.type, on = vnode.data.on;
        // call event handler(s) if exists
        if (on && on[name]) {
            invokeHandler(on[name], event);
        }
    }
    function createListener() {
        return function handler(event) {
            handleEvent(event, handler.vnode);
        };
    }
    function updateEventListeners(oldVnode, vnode) {
        var oldOn = oldVnode.data.on, oldListener = oldVnode.listener, oldElm = oldVnode.elm, on = vnode && vnode.data.on, elm = (vnode && vnode.elm), name;
        // optimization for reused immutable handlers
        if (oldOn === on) {
            return;
        }
        // remove existing listeners which no longer used
        if (oldOn && oldListener) {
            // if element changed or deleted we remove all existing listeners unconditionally
            if (!on) {
                for (name in oldOn) {
                    // remove listener if element was changed or existing listeners removed
                    oldElm.removeEventListener(name, oldListener, false);
                }
            }
            else {
                for (name in oldOn) {
                    // remove listener if existing listener removed
                    if (!on[name]) {
                        oldElm.removeEventListener(name, oldListener, false);
                    }
                }
            }
        }
        // add new listeners which has not already attached
        if (on) {
            // reuse existing listener or create new
            var listener = vnode.listener = oldVnode.listener || createListener();
            // update vnode for listener
            listener.vnode = vnode;
            // if element changed or added we add all needed listeners unconditionally
            if (!oldOn) {
                for (name in on) {
                    // add listener if element was changed or new listeners added
                    elm.addEventListener(name, listener, false);
                }
            }
            else {
                for (name in on) {
                    // add listener if new listener added
                    if (!oldOn[name]) {
                        elm.addEventListener(name, listener, false);
                    }
                }
            }
        }
    }
    return {
        create: updateEventListeners,
        update: updateEventListeners,
        destroy: updateEventListeners,
    };
};
exports.default = exports.eventListenersModule;
//# sourceMappingURL=eventListeners.js.map
});
___scope___.file("interfaces/view/globalListeners.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../../core");
const utils_1 = require("./utils");
/* istanbul ignore next */
function getContainer(lastContainer) {
    let elm = lastContainer.elm ? lastContainer.elm : lastContainer;
    return elm;
}
/* istanbul ignore next */
exports.globalListenersModule = (mod, state) => {
    function invokeHandler(handler, event, vnode) {
        if (handler instanceof Array && typeof handler[0] === 'string') {
            let options = handler[4];
            if ((options && options.listenPrevented !== true || !options) && event.defaultPrevented
                || (options && options.selfPropagated !== true || !options)
                    && (utils_1.isDescendant(vnode.elm, event.srcElement) || vnode.elm === event.srcElement)) {
                return;
            }
            if (options && options.default === false) {
                event.preventDefault();
            }
            // call function handler
            setTimeout(() => {
                mod.dispatch(core_1.computeEvent(event, handler));
            }, 0);
        }
        else if (handler instanceof Array) {
            // call multiple handlers
            for (var i = 0; i < handler.length; i++) {
                invokeHandler(handler[i], event, vnode);
            }
        }
        else if (handler === 'ignore') {
            // this handler is ignored
            event.preventDefault();
        }
        else if (handler === '' && handler === undefined) {
            // this handler is passed
            return;
        }
        else {
            mod.error('ViewInterface-globalListenersModule', 'event handler of type ' + typeof handler + 'are not allowed, data: ' + JSON.stringify(handler));
        }
    }
    function handleEvent(event, vnode) {
        var name = event.type, global = vnode.data.global;
        // call event handler(s) if exists
        if (global && global[name]) {
            invokeHandler(global[name], event, vnode);
        }
    }
    function createListener() {
        return function handler(event) {
            handleEvent(event, handler.vnode);
        };
    }
    function updateEventListeners(oldVnode, vnode) {
        var oldGlobal = oldVnode.data.global, oldListener = oldVnode.globalListener, global = vnode && vnode.data.global, name;
        // optimization for reused immutable handlers
        if (oldGlobal === global) {
            return;
        }
        // remove existing listeners which no longer used
        if (oldGlobal && oldListener) {
            // if element changed or deleted we remove all existing listeners unconditionally
            if (!global) {
                for (name in oldGlobal) {
                    // remove listener if element was changed or existing listeners removed
                    let elm = getContainer(state.lastContainer);
                    elm.removeEventListener(name, oldListener, false);
                }
            }
            else {
                for (name in oldGlobal) {
                    // remove listener if existing listener removed
                    if (!global[name]) {
                        let elm = getContainer(state.lastContainer);
                        elm.removeEventListener(name, oldListener, false);
                    }
                }
            }
        }
        // add new listeners which has not already attached
        if (global) {
            // reuse existing listener or create new
            var globalListener = vnode.globalListener = oldVnode.globalListener || createListener();
            // update vnode for listener
            globalListener.vnode = vnode;
            // if element changed or added we add all needed listeners unconditionally
            if (!oldGlobal) {
                for (name in global) {
                    // add listener if element was changed or new listeners added
                    let elm = getContainer(state.lastContainer);
                    elm.addEventListener(name, globalListener, false);
                }
            }
            else {
                for (name in global) {
                    // add listener if new listener added
                    if (!oldGlobal[name]) {
                        let elm = getContainer(state.lastContainer);
                        elm.addEventListener(name, globalListener, false);
                    }
                }
            }
        }
    }
    return {
        create: updateEventListeners,
        update: updateEventListeners,
        destroy: updateEventListeners,
    };
};
exports.default = exports.globalListenersModule;
//# sourceMappingURL=globalListeners.js.map
});
___scope___.file("interfaces/view/utils.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* istanbul ignore next */
exports.isDescendant = (parent, child) => {
    var node = child.parentNode;
    while (node != null) {
        if (node == parent) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
};
//# sourceMappingURL=utils.js.map
});
___scope___.file("interfaces/view/sizeBinding.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../../core");
const resizeSensor_1 = require("./resizeSensor");
// TODO: CRITICAL, improve performance or deprecate this way in favor of task size evaluator
/* istanbul ignore next */
exports.sizeBindingModule = (mod) => {
    function invokeHandler(evHandler, vnode, eventData) {
        if (evHandler instanceof Array && typeof evHandler[0] === 'string') {
            setTimeout(() => {
                mod.dispatch(core_1.computeEvent(eventData, evHandler));
            }, 0);
        }
        else if (evHandler instanceof Array) {
            // call multiple handlers
            for (var i = 0; i < evHandler.length; i++) {
                invokeHandler(evHandler[i], vnode, eventData);
            }
        }
        else if (evHandler === 'ignore') {
            // this handler is ignored
            return;
        }
        else if (evHandler === '' && evHandler === undefined) {
            // this handler is passed
            return;
        }
        else {
            mod.error('ViewInterface-sizeBindingModule', 'event handler of type ' + typeof evHandler + 'are not allowed, data: ' + JSON.stringify(evHandler));
        }
    }
    function createListener() {
        return function handler() {
            var vnode = handler.vnode;
            var evHandler = vnode.data.size;
            var eventData = vnode.elm.getBoundingClientRect();
            invokeHandler(evHandler, vnode, eventData);
        };
    }
    function updateSizeListener(oldVnode, vnode) {
        var oldSize = oldVnode.data.size, oldResizeListener = oldVnode.resizeListener, oldResizeSensor = oldVnode.resizeSensor, size = vnode && vnode.data.size, elm = (vnode && vnode.elm);
        // optimization for reused immutable handlers
        if (oldSize === size) {
            return;
        }
        // remove existing listeners which no longer used
        if (oldSize && oldResizeListener) {
            // if element changed or deleted we remove all existing listeners unconditionally
            if (!size) {
                // remove listener if element was changed or existing listeners removed
                oldResizeSensor.detach(oldResizeListener);
            }
        }
        // add new listeners which has not already attached
        if (size) {
            // reuse existing listener or create new
            var resizeListener = vnode.resizeListener = oldVnode.listener || createListener();
            vnode.resizeSensor = oldVnode.listener || new resizeSensor_1.ResizeSensor(elm, resizeListener);
            // update vnode for listener
            resizeListener.vnode = vnode;
        }
    }
    return {
        create: updateSizeListener,
        update: updateSizeListener,
        destroy: updateSizeListener,
    };
};
exports.default = exports.sizeBindingModule;
//# sourceMappingURL=sizeBinding.js.map
});
___scope___.file("interfaces/view/resizeSensor.js", function(exports, require, module, __filename, __dirname){

"use strict";
/**
 * Taken and adapted from:
 * https://github.com/marcj/css-element-queries/blob/master/src/ResizeSensor.js
 * Copyright Marc J. Schmidt. See the LICENSE (MIT)
 * directory of this distribution and at
 * https://github.com/marcj/css-element-queries/blob/master/LICENSE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/* istanbul ignore next */
class EventQueue {
    constructor() {
        this.q = [];
    }
    add(ev) {
        this.q.push(ev);
    }
    call() {
        var i, j;
        for (i = 0, j = this.q.length; i < j; i++) {
            this.q[i].call(this);
        }
    }
    remove(ev) {
        var newQueue = [], i, j;
        for (i = 0, j = this.q.length; i < j; i++) {
            if (this.q[i] !== ev)
                newQueue.push(this.q[i]);
        }
        this.q = newQueue;
    }
    length() {
        return this.q.length;
    }
}
exports.EventQueue = EventQueue;
/**
 * Class for dimension change detection.
 */
/* istanbul ignore next */
class ResizeSensor {
    constructor(element, callback) {
        this.element = element;
        this.callback = callback;
        this.attachResizeEvent(element, callback);
    }
    attachResizeEvent(element, resized) {
        if (element.resizedAttached) {
            element.resizedAttached.add(resized);
            return;
        }
        element.resizedAttached = new EventQueue();
        element.resizedAttached.add(resized);
        element.resizeSensor = document.createElement('div');
        element.resizeSensor.className = 'resize-sensor';
        var style = 'position: absolute; left: 0; top: 0; right: 0; bottom: 0; overflow: hidden; z-index: -1; visibility: hidden;';
        var styleChild = 'position: absolute; left: 0; top: 0; transition: 0s;';
        element.resizeSensor.style.cssText = style;
        element.resizeSensor.innerHTML =
            '<div class="resize-sensor-expand" style="' + style + '">' +
                '<div style="' + styleChild + '"></div>' +
                '</div>' +
                '<div class="resize-sensor-shrink" style="' + style + '">' +
                '<div style="' + styleChild + ' width: 200%; height: 200%"></div>' +
                '</div>';
        element.appendChild(element.resizeSensor);
        if (element.resizeSensor.offsetParent !== element) {
            element.style.position = 'relative';
        }
        var expand = element.resizeSensor.childNodes[0];
        var expandChild = expand.childNodes[0];
        var shrink = element.resizeSensor.childNodes[1];
        var dirty, rafId, newWidth, newHeight;
        var lastWidth = element.offsetWidth;
        var lastHeight = element.offsetHeight;
        var reset = function () {
            expandChild.style.width = '100000px';
            expandChild.style.height = '100000px';
            expand.scrollLeft = 100000;
            expand.scrollTop = 100000;
            shrink.scrollLeft = 100000;
            shrink.scrollTop = 100000;
        };
        // setTimeout waits until rendering is done
        setTimeout(() => reset(), 0);
        var onResized = function () {
            rafId = 0;
            if (!dirty)
                return;
            lastWidth = newWidth;
            lastHeight = newHeight;
            if (element.resizedAttached) {
                element.resizedAttached.call();
            }
        };
        var onScroll = function () {
            newWidth = element.offsetWidth;
            newHeight = element.offsetHeight;
            dirty = newWidth != lastWidth || newHeight != lastHeight;
            if (dirty && !rafId) {
                rafId = requestAnimationFrame(onResized);
            }
            reset();
        };
        var addEvent = function (el, name, cb) {
            if (el.attachEvent) {
                el.attachEvent('on' + name, cb);
            }
            else {
                el.addEventListener(name, cb);
            }
        };
        addEvent(expand, 'scroll', onScroll);
        addEvent(shrink, 'scroll', onScroll);
    }
    detach(ev) {
        let elem = this.element;
        if (elem.resizedAttached && typeof ev == 'function') {
            elem.resizedAttached.remove(ev);
            if (elem.resizedAttached.length())
                return;
        }
        if (elem.resizeSensor) {
            if (elem.contains(elem.resizeSensor)) {
                elem.removeChild(elem.resizeSensor);
            }
            delete elem.resizeSensor;
            delete elem.resizedAttached;
        }
    }
}
exports.ResizeSensor = ResizeSensor;
//# sourceMappingURL=resizeSensor.js.map
});
___scope___.file("interfaces/view/h.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copied from snabbdom
// Commit: https://github.com/snabbdom/snabbdom/commit/c5d513dfd90fca1188e63cf8abac5cc3eb06bdcf
const vnode_1 = require("./vnode");
const is = require("./is");
/* istanbul ignore next */
function addNS(data, children, sel) {
    data.ns = 'http://www.w3.org/2000/svg';
    if (sel !== 'foreignObject' && children !== undefined) {
        for (let i = 0; i < children.length; ++i) {
            let childData = children[i].data;
            if (childData !== undefined) {
                addNS(childData, children[i].children, children[i].sel);
            }
        }
    }
}
/* istanbul ignore next */
function h(sel, b, c) {
    var data = {}, children, text, i;
    if (c !== undefined) {
        data = b;
        if (is.array(c)) {
            children = c;
        }
        else if (is.primitive(c)) {
            text = c;
        }
        else if (c && c.sel) {
            children = [c];
        }
    }
    else if (b !== undefined) {
        if (is.array(b)) {
            children = b;
        }
        else if (is.primitive(b)) {
            text = b;
        }
        else if (b && b.sel) {
            children = [b];
        }
        else {
            data = b;
        }
    }
    if (is.array(children)) {
        for (i = 0; i < children.length; ++i) {
            if (is.primitive(children[i]))
                children[i] = vnode_1.vnode(undefined, undefined, undefined, children[i]);
        }
    }
    if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g' &&
        (sel.length === 3 || sel[3] === '.' || sel[3] === '#')) {
        addNS(data, children, sel);
    }
    return vnode_1.vnode(sel, data, children, text, undefined);
}
exports.h = h;
exports.default = h;
//# sourceMappingURL=h.js.map
});
___scope___.file("interfaces/view/vnode.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* istanbul ignore next */
function vnode(sel, data, children, text, elm) {
    let key = data === undefined ? undefined : data.key;
    return { sel: sel, data: data, children: children,
        text: text, elm: elm, key: key };
}
exports.vnode = vnode;
exports.default = vnode;
//# sourceMappingURL=vnode.js.map
});
___scope___.file("interfaces/view/is.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copied from snabbdom
// Commit: https://github.com/snabbdom/snabbdom/commit/f552b0e8eda30a84e59f212e98651463ec71a53f
exports.array = Array.isArray;
/* istanbul ignore next */
function primitive(s) {
    return typeof s === 'string' || typeof s === 'number';
}
exports.primitive = primitive;
//# sourceMappingURL=is.js.map
});
___scope___.file("utils/worker.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* istanbul ignore next */
function makeSyncQueue() {
    let queue = [];
    return {
        queue,
        addWaiter(waiter) {
            queue.push(waiter);
        },
        next(data) {
            if (queue[0] && queue[0](data)) {
                queue.shift();
            }
        },
    };
}
exports.makeSyncQueue = makeSyncQueue;
/* istanbul ignore next */
exports.workerHandler = (type, name, syncQueue, workerAPI) => (mod) => {
    /* istanbul ignore next */
    let _self = workerAPI ? workerAPI : self;
    return {
        state: undefined,
        handle: async (value) => {
            _self.postMessage([type, name, 'handle', value]);
            if (type === 'group') {
                return new Promise((resolve) => {
                    syncQueue.addWaiter(data => {
                        if (data[0] === 'setGroup') {
                            resolve();
                            return true;
                        }
                    });
                });
            }
        },
        dispose: () => {
            _self.postMessage([type, name, 'dispose']);
        },
    };
};
/* istanbul ignore next */
exports.workerLog = (type, workerAPI) => {
    /* istanbul ignore next */
    let _self = workerAPI ? workerAPI : self;
    return (source, description) => {
        _self.postMessage(['log', type, source, description]);
    };
};
// receives messages from runWorker
/* istanbul ignore next */
exports.workerListener = (syncQueue, workerAPI) => (mod) => {
    /* istanbul ignore next */
    let _self = workerAPI ? workerAPI : self;
    // allows to dispatch inputs from the main thread
    _self.onmessage = ev => {
        let data = ev.data;
        switch (data[0]) {
            case 'dispatch':
                mod.dispatch(data[1]);
                /* istanbul ignore next */
                break;
            case 'setGroup':
                mod.setGroup(data[1], data[2], data[3]);
                /* istanbul ignore next */
                break;
            case 'dispose':
                mod.dispose();
                _self.postMessage(['dispose']);
                /* istanbul ignore next */
                break;
            case 'nest':
                // not implemented yet, should deserialize a component with a safe eval
                mod.error('workerListener', `unimplemented method`);
                /* istanbul ignore next */
                break;
            case 'nestAll':
                // not implemented yet, should deserialize a list of components with a safe eval
                mod.error('workerListener', `unimplemented method`);
                /* istanbul ignore next */
                break;
            case 'unnest':
                // not implemented yet, should deserialize a component with a safe eval
                mod.error('workerListener', `unimplemented method`);
                /* istanbul ignore next */
                break;
            case 'unnestAll':
                // not implemented yet, should deserialize a list of components with a safe eval
                mod.error('workerListener', `unimplemented method`);
                /* istanbul ignore next */
                break;
            /* istanbul ignore next */
            default:
                mod.error('workerListener', `unknown message type recived from worker: ${data.join(', ')}`);
        }
        syncQueue.next(data);
    };
};
function runWorker(def) {
    let worker = def.worker;
    let groupObjects = {};
    let taskObjects = {};
    let interfaceObjects = {};
    /* istanbul ignore next */
    let reattach = async (comp) => {
        def.error('reattach', 'unimplemented method');
    };
    // API for modules
    /* istanbul ignore next */
    let moduleAPI = {
        // dispatch function type used for handlers
        dispatch: async (eventData) => worker.postMessage(['dispatch', eventData]),
        dispose,
        reattach,
        // nest a component to the component index
        nest: async (name, component, isStatic = false) => worker.postMessage(['nest', name, component]),
        // nest many components to the component index
        nestAll: async (components, isStatic = false) => worker.postMessage(['nestAll', components]),
        // unnest a component to the component index
        unnest: (name) => worker.postMessage(['unnest', name]),
        // unnest many components to the component index
        unnestAll: (components) => worker.postMessage(['unnestAll', components]),
        // delegated methods
        setGroup: (id, name, group) => worker.postMessage(['setGroup', id, name, group]),
        warn: def.warn,
        error: def.error,
    };
    /* istanbul ignore else */
    if (def.groups) {
        for (let i = 0, names = Object.keys(def.groups), len = names.length; i < len; i++) {
            groupObjects[names[i]] = def.groups[names[i]](moduleAPI);
        }
    }
    /* istanbul ignore else */
    if (def.tasks) {
        for (let i = 0, names = Object.keys(def.tasks), len = names.length; i < len; i++) {
            taskObjects[names[i]] = def.tasks[names[i]](moduleAPI);
        }
    }
    /* istanbul ignore else */
    if (def.interfaces) {
        for (let i = 0, names = Object.keys(def.interfaces), len = names.length; i < len; i++) {
            interfaceObjects[names[i]] = def.interfaces[names[i]](moduleAPI);
        }
    }
    // TODO: reverse message sintax
    /* istanbul ignore next */
    worker.onmessage = async (ev) => {
        let data = ev.data;
        switch (data[0]) {
            case 'interface':
                /* istanbul ignore else */
                if (data[2] === 'handle') {
                    await interfaceObjects[data[1]].handle(data[3]);
                    /* istanbul ignore next */
                    break;
                }
                /* istanbul ignore else */
                if (data[2] === 'dispose') {
                    interfaceObjects[data[1]].dispose();
                    /* istanbul ignore next */
                    break;
                }
            case 'task':
                /* istanbul ignore else */
                if (data[2] === 'handle') {
                    await taskObjects[data[1]].handle(data[3]);
                    /* istanbul ignore next */
                    break;
                }
                /* istanbul ignore else */
                if (data[2] === 'dispose') {
                    await taskObjects[data[1]].dispose();
                    /* istanbul ignore next */
                    break;
                }
            case 'group':
                /* istanbul ignore else */
                if (data[2] === 'handle') {
                    await groupObjects[data[1]].handle(data[3]);
                    /* istanbul ignore next */
                    break;
                }
                /* istanbul ignore else */
                if (data[2] === 'dispose') {
                    groupObjects[data[1]].dispose();
                    /* istanbul ignore next */
                    break;
                }
            case 'log':
                /* istanbul ignore else */
                if (moduleAPI[data[1]]) {
                    moduleAPI[data[1]](data[2], data[3]);
                    /* istanbul ignore next */
                    break;
                }
            case 'dispose':
                /* istanbul ignore else */
                if (def.destroy) {
                    def.destroy(moduleAPI);
                    /* istanbul ignore next */
                }
                break;
            /* istanbul ignore next */
            default:
                moduleAPI.error('runWorker', `unknown message type recived from worker: ${data.join(', ')}`);
        }
    };
    /* istanbul ignore next */
    function dispose() {
        worker.postMessage(['dispose']);
    }
    return {
        worker,
        moduleAPI,
        groupObjects,
        taskObjects,
        interfaceObjects,
    };
}
exports.runWorker = runWorker;
//# sourceMappingURL=worker.js.map
});
___scope___.file("groups/style.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typestyle_1 = require("typestyle");
const style_1 = require("../utils/style");
// insert styles in a DOM container at head
exports.styleHandler = (containerName, debug = false, groupName = 'style') => (mod) => {
    let container;
    if (typeof window !== 'undefined') {
        container = document.createElement('style');
        // named container
        if (containerName !== '' && containerName !== undefined) {
            container.id = containerName;
        }
        document.head.appendChild(container);
    }
    let instance = typestyle_1.createTypeStyle(container);
    let state = {
        container,
        instance,
    };
    let name, parts, style;
    return {
        state,
        handle: async ([id, styleObj]) => {
            if (debug) {
                parts = id.split('$');
                name = parts[parts.length - 1];
            }
            style = style_1.styleGroup(instance, styleObj, name);
            instance.forceRenderStyles();
            mod.setGroup(id, groupName, style);
        },
        dispose: () => {
            state = {};
            if (container) {
                container.remove();
            }
        },
    };
};
//# sourceMappingURL=style.js.map
});
return ___scope___.entry = "core/index.js";
});
FuseBox.pkg("deepmerge", {}, function(___scope___){
___scope___.file("dist/umd.js", function(exports, require, module, __filename, __dirname){

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.deepmerge = factory());
}(this, (function () { 'use strict';

var isMergeableObject = function isMergeableObject(value) {
	return isNonNullObject(value)
		&& !isSpecial(value)
};

function isNonNullObject(value) {
	return !!value && typeof value === 'object'
}

function isSpecial(value) {
	var stringValue = Object.prototype.toString.call(value);

	return stringValue === '[object RegExp]'
		|| stringValue === '[object Date]'
		|| isReactElement(value)
}

// see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25
var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;

function isReactElement(value) {
	return value.$$typeof === REACT_ELEMENT_TYPE
}

function emptyTarget(val) {
    return Array.isArray(val) ? [] : {}
}

function cloneIfNecessary(value, optionsArgument) {
    var clone = optionsArgument && optionsArgument.clone === true;
    return (clone && isMergeableObject(value)) ? deepmerge(emptyTarget(value), value, optionsArgument) : value
}

function defaultArrayMerge(target, source, optionsArgument) {
    var destination = target.slice();
    source.forEach(function(e, i) {
        if (typeof destination[i] === 'undefined') {
            destination[i] = cloneIfNecessary(e, optionsArgument);
        } else if (isMergeableObject(e)) {
            destination[i] = deepmerge(target[i], e, optionsArgument);
        } else if (target.indexOf(e) === -1) {
            destination.push(cloneIfNecessary(e, optionsArgument));
        }
    });
    return destination
}

function mergeObject(target, source, optionsArgument) {
    var destination = {};
    if (isMergeableObject(target)) {
        Object.keys(target).forEach(function(key) {
            destination[key] = cloneIfNecessary(target[key], optionsArgument);
        });
    }
    Object.keys(source).forEach(function(key) {
        if (!isMergeableObject(source[key]) || !target[key]) {
            destination[key] = cloneIfNecessary(source[key], optionsArgument);
        } else {
            destination[key] = deepmerge(target[key], source[key], optionsArgument);
        }
    });
    return destination
}

function deepmerge(target, source, optionsArgument) {
    var sourceIsArray = Array.isArray(source);
    var targetIsArray = Array.isArray(target);
    var options = optionsArgument || { arrayMerge: defaultArrayMerge };
    var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

    if (!sourceAndTargetTypesMatch) {
        return cloneIfNecessary(source, optionsArgument)
    } else if (sourceIsArray) {
        var arrayMerge = options.arrayMerge || defaultArrayMerge;
        return arrayMerge(target, source, optionsArgument)
    } else {
        return mergeObject(target, source, optionsArgument)
    }
}

deepmerge.all = function deepmergeAll(array, optionsArgument) {
    if (!Array.isArray(array) || array.length < 2) {
        throw new Error('first argument should be an array with at least two elements')
    }

    // we are sure there are at least 2 values, so it is safe to have no initial value
    return array.reduce(function(prev, next) {
        return deepmerge(prev, next, optionsArgument)
    })
};

var deepmerge_1 = deepmerge;

return deepmerge_1;

})));

});
return ___scope___.entry = "dist/umd.js";
});
FuseBox.pkg("deep-equal", {}, function(___scope___){
___scope___.file("index.js", function(exports, require, module, __filename, __dirname){

var pSlice = Array.prototype.slice;
var objectKeys = require('./lib/keys.js');
var isArguments = require('./lib/is_arguments.js');

var deepEqual = module.exports = function (actual, expected, opts) {
  if (!opts) opts = {};
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
    return opts.strict ? actual === expected : actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected, opts);
  }
}

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isBuffer (x) {
  if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
    return false;
  }
  if (x.length > 0 && typeof x[0] !== 'number') return false;
  return true;
}

function objEquiv(a, b, opts) {
  var i, key;
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return deepEqual(a, b, opts);
  }
  if (isBuffer(a)) {
    if (!isBuffer(b)) {
      return false;
    }
    if (a.length !== b.length) return false;
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b);
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key], opts)) return false;
  }
  return typeof a === typeof b;
}

});
___scope___.file("lib/keys.js", function(exports, require, module, __filename, __dirname){

exports = module.exports = typeof Object.keys === 'function'
  ? Object.keys : shim;

exports.shim = shim;
function shim (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}

});
___scope___.file("lib/is_arguments.js", function(exports, require, module, __filename, __dirname){

var supportsArgumentsClass = (function(){
  return Object.prototype.toString.call(arguments)
})() == '[object Arguments]';

exports = module.exports = supportsArgumentsClass ? supported : unsupported;

exports.supported = supported;
function supported(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
};

exports.unsupported = unsupported;
function unsupported(object){
  return object &&
    typeof object == 'object' &&
    typeof object.length == 'number' &&
    Object.prototype.hasOwnProperty.call(object, 'callee') &&
    !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||
    false;
};

});
return ___scope___.entry = "index.js";
});
FuseBox.pkg("typestyle", {}, function(___scope___){
___scope___.file("lib/index.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var typestyle_1 = require("./internal/typestyle");
exports.TypeStyle = typestyle_1.TypeStyle;
/**
 * All the CSS types in the 'types' namespace
 */
var types = require("./types");
exports.types = types;
/**
 * Export certain utilities
 */
var utilities_1 = require("./internal/utilities");
exports.extend = utilities_1.extend;
exports.classes = utilities_1.classes;
exports.media = utilities_1.media;
/** Zero configuration, default instance of TypeStyle */
var ts = new typestyle_1.TypeStyle({ autoGenerateTag: true });
/** Sets the target tag where we write the css on style updates */
exports.setStylesTarget = ts.setStylesTarget;
/**
 * Insert `raw` CSS as a string. This is useful for e.g.
 * - third party CSS that you are customizing with template strings
 * - generating raw CSS in JavaScript
 * - reset libraries like normalize.css that you can use without loaders
 */
exports.cssRaw = ts.cssRaw;
/**
 * Takes CSSProperties and registers it to a global selector (body, html, etc.)
 */
exports.cssRule = ts.cssRule;
/**
 * Renders styles to the singleton tag imediately
 * NOTE: You should only call it on initial render to prevent any non CSS flash.
 * After that it is kept sync using `requestAnimationFrame` and we haven't noticed any bad flashes.
 **/
exports.forceRenderStyles = ts.forceRenderStyles;
/**
 * Utility function to register an @font-face
 */
exports.fontFace = ts.fontFace;
/**
 * Allows use to use the stylesheet in a node.js environment
 */
exports.getStyles = ts.getStyles;
/**
 * Takes keyframes and returns a generated animationName
 */
exports.keyframes = ts.keyframes;
/**
 * Helps with testing. Reinitializes FreeStyle + raw
 */
exports.reinit = ts.reinit;
/**
 * Takes CSSProperties and return a generated className you can use on your component
 */
exports.style = ts.style;
/**
 * Creates a new instance of TypeStyle separate from the default instance.
 *
 * - Use this for creating a different typestyle instance for a shadow dom component.
 * - Use this if you don't want an auto tag generated and you just want to collect the CSS.
 *
 * NOTE: styles aren't shared between different instances.
 */
function createTypeStyle(target) {
    var instance = new typestyle_1.TypeStyle({ autoGenerateTag: false });
    if (target) {
        instance.setStylesTarget(target);
    }
    return instance;
}
exports.createTypeStyle = createTypeStyle;

});
___scope___.file("lib/internal/typestyle.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var formatting_1 = require("./formatting");
var utilities_1 = require("./utilities");
var FreeStyle = require("free-style");
/**
 * Creates an instance of free style with our options
 */
var createFreeStyle = function () { return FreeStyle.create(
/** Use the default hash function */
undefined, 
/** Preserve $debugName values */
true); };
/**
 * Maintains a single stylesheet and keeps it in sync with requested styles
 */
var TypeStyle = (function () {
    function TypeStyle(_a) {
        var autoGenerateTag = _a.autoGenerateTag;
        var _this = this;
        /**
         * Insert `raw` CSS as a string. This is useful for e.g.
         * - third party CSS that you are customizing with template strings
         * - generating raw CSS in JavaScript
         * - reset libraries like normalize.css that you can use without loaders
         */
        this.cssRaw = function (mustBeValidCSS) {
            if (!mustBeValidCSS) {
                return;
            }
            _this._raw += mustBeValidCSS || '';
            _this._pendingRawChange = true;
            _this._styleUpdated();
        };
        /**
         * Takes CSSProperties and registers it to a global selector (body, html, etc.)
         */
        this.cssRule = function (selector) {
            var objects = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                objects[_i - 1] = arguments[_i];
            }
            var object = formatting_1.ensureStringObj(utilities_1.extend.apply(void 0, objects)).result;
            _this._freeStyle.registerRule(selector, object);
            _this._styleUpdated();
            return;
        };
        /**
         * Renders styles to the singleton tag imediately
         * NOTE: You should only call it on initial render to prevent any non CSS flash.
         * After that it is kept sync using `requestAnimationFrame` and we haven't noticed any bad flashes.
         **/
        this.forceRenderStyles = function () {
            var target = _this._getTag();
            if (!target) {
                return;
            }
            target.textContent = _this.getStyles();
        };
        /**
         * Utility function to register an @font-face
         */
        this.fontFace = function () {
            var fontFace = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                fontFace[_i] = arguments[_i];
            }
            var freeStyle = _this._freeStyle;
            for (var _a = 0, _b = fontFace; _a < _b.length; _a++) {
                var face = _b[_a];
                freeStyle.registerRule('@font-face', face);
            }
            _this._styleUpdated();
            return;
        };
        /**
         * Allows use to use the stylesheet in a node.js environment
         */
        this.getStyles = function () {
            return (_this._raw || '') + _this._freeStyle.getStyles();
        };
        /**
         * Takes keyframes and returns a generated animationName
         */
        this.keyframes = function (frames) {
            var _a = formatting_1.explodeKeyframes(frames), keyframes = _a.keyframes, $debugName = _a.$debugName;
            // TODO: replace $debugName with display name
            var animationName = _this._freeStyle.registerKeyframes(keyframes, $debugName);
            _this._styleUpdated();
            return animationName;
        };
        /**
         * Helps with testing. Reinitializes FreeStyle + raw
         */
        this.reinit = function () {
            /** reinit freestyle */
            var freeStyle = createFreeStyle();
            _this._freeStyle = freeStyle;
            _this._lastFreeStyleChangeId = freeStyle.changeId;
            /** reinit raw */
            _this._raw = '';
            _this._pendingRawChange = false;
            /** Clear any styles that were flushed */
            var target = _this._getTag();
            if (target) {
                target.textContent = '';
            }
        };
        /** Sets the target tag where we write the css on style updates */
        this.setStylesTarget = function (tag) {
            /** Clear any data in any previous tag */
            if (_this._tag) {
                _this._tag.textContent = '';
            }
            _this._tag = tag;
            /** This special time buffer immediately */
            _this.forceRenderStyles();
        };
        /**
         * Takes CSSProperties and return a generated className you can use on your component
         */
        this.style = function () {
            var objects = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                objects[_i] = arguments[_i];
            }
            var freeStyle = _this._freeStyle;
            var _a = formatting_1.ensureStringObj(utilities_1.extend.apply(void 0, objects)), result = _a.result, debugName = _a.debugName;
            var className = debugName ? freeStyle.registerStyle(result, debugName) : freeStyle.registerStyle(result);
            _this._styleUpdated();
            return className;
        };
        var freeStyle = createFreeStyle();
        this._autoGenerateTag = autoGenerateTag;
        this._freeStyle = freeStyle;
        this._lastFreeStyleChangeId = freeStyle.changeId;
        this._pending = 0;
        this._pendingRawChange = false;
        this._raw = '';
        this._tag = undefined;
    }
    /**
     * Only calls cb all sync operations settle
     */
    TypeStyle.prototype._afterAllSync = function (cb) {
        var _this = this;
        this._pending++;
        var pending = this._pending;
        utilities_1.raf(function () {
            if (pending !== _this._pending) {
                return;
            }
            cb();
        });
    };
    TypeStyle.prototype._getTag = function () {
        if (this._tag) {
            return this._tag;
        }
        if (this._autoGenerateTag) {
            var tag = typeof window === 'undefined'
                ? { textContent: '' }
                : document.createElement('style');
            if (typeof document !== 'undefined') {
                document.head.appendChild(tag);
            }
            this._tag = tag;
            return tag;
        }
        return undefined;
    };
    /** Checks if the style tag needs updating and if so queues up the change */
    TypeStyle.prototype._styleUpdated = function () {
        var _this = this;
        var changeId = this._freeStyle.changeId;
        var lastChangeId = this._lastFreeStyleChangeId;
        if (!this._pendingRawChange && changeId === lastChangeId) {
            return;
        }
        this._lastFreeStyleChangeId = changeId;
        this._pendingRawChange = false;
        this._afterAllSync(function () { return _this.forceRenderStyles(); });
    };
    return TypeStyle;
}());
exports.TypeStyle = TypeStyle;

});
___scope___.file("lib/internal/formatting.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FreeStyle = require("free-style");
/**
 * We need to do the following to *our* objects before passing to freestyle:
 * - For any `$nest` directive move up to FreeStyle style nesting
 * - For any `$unique` directive map to FreeStyle Unique
 * - For any `$debugName` directive return the debug name
 */
function ensureStringObj(object) {
    /** The final result we will return */
    var result = {};
    var debugName = '';
    for (var key in object) {
        /** Grab the value upfront */
        var val = object[key];
        /** TypeStyle configuration options */
        if (key === '$unique') {
            result[FreeStyle.IS_UNIQUE] = val;
        }
        else if (key === '$nest') {
            var nested = val;
            for (var selector in nested) {
                var subproperties = nested[selector];
                result[selector] = ensureStringObj(subproperties).result;
            }
        }
        else if (key === '$debugName') {
            debugName = val;
        }
        else {
            result[key] = val;
        }
    }
    return { result: result, debugName: debugName };
}
exports.ensureStringObj = ensureStringObj;
// todo: better name here
function explodeKeyframes(frames) {
    var result = { $debugName: undefined, keyframes: {} };
    for (var offset in frames) {
        var val = frames[offset];
        if (offset === '$debugName') {
            result.$debugName = val;
        }
        else {
            result.keyframes[offset] = val;
        }
    }
    return result;
}
exports.explodeKeyframes = explodeKeyframes;

});
___scope___.file("lib/internal/utilities.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Raf for node + browser */
exports.raf = typeof requestAnimationFrame === 'undefined' ? setTimeout : requestAnimationFrame.bind(window);
/**
 * Utility to join classes conditionally
 */
function classes() {
    var classes = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        classes[_i] = arguments[_i];
    }
    return classes.filter(function (c) { return !!c; }).join(' ');
}
exports.classes = classes;
/**
 * Merges various styles into a single style object.
 * Note: if two objects have the same property the last one wins
 */
function extend() {
    var objects = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        objects[_i] = arguments[_i];
    }
    /** The final result we will return */
    var result = {};
    for (var _a = 0, objects_1 = objects; _a < objects_1.length; _a++) {
        var object = objects_1[_a];
        if (object == null || object === false) {
            continue;
        }
        for (var key in object) {
            /** Falsy values except a explicit 0 is ignored */
            var val = object[key];
            if (!val && val !== 0) {
                continue;
            }
            /** if nested media or pseudo selector */
            if (key === '$nest' && val) {
                result[key] = result['$nest'] ? extend(result['$nest'], val) : val;
            }
            else if ((key.indexOf('&') !== -1 || key.indexOf('@media') === 0)) {
                result[key] = result[key] ? extend(result[key], val) : val;
            }
            else {
                result[key] = val;
            }
        }
    }
    return result;
}
exports.extend = extend;
/**
 * Utility to help customize styles with media queries. e.g.
 * ```
 * style(
 *  media({maxWidth:500}, {color:'red'})
 * )
 * ```
 */
exports.media = function (mediaQuery) {
    var objects = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        objects[_i - 1] = arguments[_i];
    }
    var mediaQuerySections = [];
    if (mediaQuery.type)
        mediaQuerySections.push(mediaQuery.type);
    if (mediaQuery.orientation)
        mediaQuerySections.push(mediaQuery.orientation);
    if (mediaQuery.minWidth)
        mediaQuerySections.push("(min-width: " + mediaLength(mediaQuery.minWidth) + ")");
    if (mediaQuery.maxWidth)
        mediaQuerySections.push("(max-width: " + mediaLength(mediaQuery.maxWidth) + ")");
    if (mediaQuery.minHeight)
        mediaQuerySections.push("(min-height: " + mediaLength(mediaQuery.minHeight) + ")");
    if (mediaQuery.maxHeight)
        mediaQuerySections.push("(max-height: " + mediaLength(mediaQuery.maxHeight) + ")");
    var stringMediaQuery = "@media " + mediaQuerySections.join(' and ');
    var object = {
        $nest: (_a = {},
            _a[stringMediaQuery] = extend.apply(void 0, objects),
            _a)
    };
    return object;
    var _a;
};
var mediaLength = function (value) {
    return typeof value === 'string' ? value : value + "px";
};

});
___scope___.file("lib/types.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

});
return ___scope___.entry = "lib/index.js";
});
FuseBox.pkg("free-style", {}, function(___scope___){
___scope___.file("dist/free-style.js", function(exports, require, module, __filename, __dirname){
/* fuse:injection: */ var process = require("process");
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The unique id is used for unique hashes.
 */
var uniqueId = 0;
/**
 * Tag styles with this string to get unique hashes.
 */
exports.IS_UNIQUE = '__DO_NOT_DEDUPE_STYLE__';
var upperCasePattern = /[A-Z]/g;
var msPattern = /^ms-/;
var interpolatePattern = /&/g;
var propLower = function (m) { return "-" + m.toLowerCase(); };
/**
 * CSS properties that are valid unit-less numbers.
 */
var cssNumberProperties = [
    'animation-iteration-count',
    'box-flex',
    'box-flex-group',
    'column-count',
    'counter-increment',
    'counter-reset',
    'flex',
    'flex-grow',
    'flex-positive',
    'flex-shrink',
    'flex-negative',
    'font-weight',
    'line-clamp',
    'line-height',
    'opacity',
    'order',
    'orphans',
    'tab-size',
    'widows',
    'z-index',
    'zoom',
    // SVG properties.
    'fill-opacity',
    'stroke-dashoffset',
    'stroke-opacity',
    'stroke-width'
];
/**
 * Map of css number properties.
 */
var CSS_NUMBER = Object.create(null);
// Add vendor prefixes to all unit-less properties.
for (var _i = 0, _a = ['-webkit-', '-ms-', '-moz-', '-o-', '']; _i < _a.length; _i++) {
    var prefix = _a[_i];
    for (var _b = 0, cssNumberProperties_1 = cssNumberProperties; _b < cssNumberProperties_1.length; _b++) {
        var property = cssNumberProperties_1[_b];
        CSS_NUMBER[prefix + property] = true;
    }
}
/**
 * Transform a JavaScript property into a CSS property.
 */
function hyphenate(propertyName) {
    return propertyName
        .replace(upperCasePattern, propLower)
        .replace(msPattern, '-ms-'); // Internet Explorer vendor prefix.
}
/**
 * Generate a hash value from a string.
 */
function stringHash(str) {
    var value = 5381;
    var len = str.length;
    while (len--)
        value = (value * 33) ^ str.charCodeAt(len);
    return (value >>> 0).toString(36);
}
exports.stringHash = stringHash;
/**
 * Transform a style string to a CSS string.
 */
function styleToString(key, value) {
    if (typeof value === 'number' && value !== 0 && !CSS_NUMBER[key]) {
        return key + ":" + value + "px";
    }
    return key + ":" + value;
}
/**
 * Sort an array of tuples by first value.
 */
function sortTuples(value) {
    return value.sort(function (a, b) { return a[0] > b[0] ? 1 : -1; });
}
/**
 * Categorize user styles.
 */
function parseStyles(styles, hasNestedStyles) {
    var properties = [];
    var nestedStyles = [];
    var isUnique = false;
    // Sort keys before adding to styles.
    for (var _i = 0, _a = Object.keys(styles); _i < _a.length; _i++) {
        var key = _a[_i];
        var value = styles[key];
        if (value !== null && value !== undefined) {
            if (key === exports.IS_UNIQUE) {
                isUnique = true;
            }
            else if (typeof value === 'object') {
                if (Array.isArray(value)) {
                    var prop = hyphenate(key.trim());
                    for (var i = 0; i < value.length; i++) {
                        properties.push([prop, value[i]]);
                    }
                }
                else {
                    nestedStyles.push([key.trim(), value]);
                }
            }
            else {
                properties.push([hyphenate(key.trim()), value]);
            }
        }
    }
    return {
        styleString: stringifyProperties(sortTuples(properties)),
        nestedStyles: hasNestedStyles ? nestedStyles : sortTuples(nestedStyles),
        isUnique: isUnique
    };
}
/**
 * Stringify an array of property tuples.
 */
function stringifyProperties(properties) {
    var end = properties.length - 1;
    var result = '';
    for (var i = 0; i < properties.length; i++) {
        var _a = properties[i], name = _a[0], value = _a[1];
        result += styleToString(name, value) + (i === end ? '' : ';');
    }
    return result;
}
/**
 * Interpolate CSS selectors.
 */
function interpolate(selector, parent) {
    if (selector.indexOf('&') > -1) {
        return selector.replace(interpolatePattern, parent);
    }
    return parent + " " + selector;
}
/**
 * Recursive loop building styles with deferred selectors.
 */
function stylize(cache, selector, styles, list, parent) {
    var _a = parseStyles(styles, !!selector), styleString = _a.styleString, nestedStyles = _a.nestedStyles, isUnique = _a.isUnique;
    var pid = styleString;
    if (selector.charCodeAt(0) === 64 /* @ */) {
        var rule = cache.add(new Rule(selector, parent ? undefined : styleString, cache.hash));
        // Nested styles support (e.g. `.foo > @media > .bar`).
        if (styleString && parent) {
            var style = rule.add(new Style(styleString, rule.hash, isUnique ? "u" + (++uniqueId).toString(36) : undefined));
            list.push([parent, style]);
        }
        for (var _i = 0, nestedStyles_1 = nestedStyles; _i < nestedStyles_1.length; _i++) {
            var _b = nestedStyles_1[_i], name = _b[0], value = _b[1];
            pid += name + stylize(rule, name, value, list, parent);
        }
    }
    else {
        var key = parent ? interpolate(selector, parent) : selector;
        if (styleString) {
            var style = cache.add(new Style(styleString, cache.hash, isUnique ? "u" + (++uniqueId).toString(36) : undefined));
            list.push([key, style]);
        }
        for (var _c = 0, nestedStyles_2 = nestedStyles; _c < nestedStyles_2.length; _c++) {
            var _d = nestedStyles_2[_c], name = _d[0], value = _d[1];
            pid += name + stylize(cache, name, value, list, key);
        }
    }
    return pid;
}
/**
 * Register all styles, but collect for selector interpolation using the hash.
 */
function composeStyles(container, selector, styles, isStyle, displayName) {
    var cache = new Cache(container.hash);
    var list = [];
    var pid = stylize(cache, selector, styles, list);
    var hash = "f" + cache.hash(pid);
    var id = displayName ? displayName + "_" + hash : hash;
    for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
        var _a = list_1[_i], selector_1 = _a[0], style = _a[1];
        var key = isStyle ? interpolate(selector_1, "." + id) : selector_1;
        style.add(new Selector(key, style.hash, undefined, pid));
    }
    return { cache: cache, pid: pid, id: id };
}
/**
 * Cache to list to styles.
 */
function join(strings) {
    var res = '';
    for (var _i = 0, strings_1 = strings; _i < strings_1.length; _i++) {
        var str = strings_1[_i];
        res += str;
    }
    return res;
}
/**
 * Noop changes.
 */
var noopChanges = {
    add: function () { return undefined; },
    change: function () { return undefined; },
    remove: function () { return undefined; }
};
/**
 * Implement a cache/event emitter.
 */
var Cache = /** @class */ (function () {
    function Cache(hash, changes) {
        if (hash === void 0) { hash = stringHash; }
        if (changes === void 0) { changes = noopChanges; }
        this.hash = hash;
        this.changes = changes;
        this.sheet = [];
        this.changeId = 0;
        this._keys = [];
        this._children = Object.create(null);
        this._counters = Object.create(null);
    }
    Cache.prototype.add = function (style) {
        var count = this._counters[style.id] || 0;
        var item = this._children[style.id] || style.clone();
        this._counters[style.id] = count + 1;
        if (count === 0) {
            this._children[item.id] = item;
            this._keys.push(item.id);
            this.sheet.push(item.getStyles());
            this.changeId++;
            this.changes.add(item, this._keys.length - 1);
        }
        else {
            // Check if contents are different.
            if (item.getIdentifier() !== style.getIdentifier()) {
                throw new TypeError("Hash collision: " + style.getStyles() + " === " + item.getStyles());
            }
            var oldIndex = this._keys.indexOf(style.id);
            var newIndex = this._keys.length - 1;
            var prevChangeId = this.changeId;
            if (oldIndex !== newIndex) {
                this._keys.splice(oldIndex, 1);
                this._keys.push(style.id);
                this.changeId++;
            }
            if (item instanceof Cache && style instanceof Cache) {
                var prevChangeId_1 = item.changeId;
                item.merge(style);
                if (item.changeId !== prevChangeId_1) {
                    this.changeId++;
                }
            }
            if (this.changeId !== prevChangeId) {
                if (oldIndex === newIndex) {
                    this.sheet.splice(oldIndex, 1, item.getStyles());
                }
                else {
                    this.sheet.splice(oldIndex, 1);
                    this.sheet.splice(newIndex, 0, item.getStyles());
                }
                this.changes.change(item, oldIndex, newIndex);
            }
        }
        return item;
    };
    Cache.prototype.remove = function (style) {
        var count = this._counters[style.id];
        if (count > 0) {
            this._counters[style.id] = count - 1;
            var item = this._children[style.id];
            var index = this._keys.indexOf(item.id);
            if (count === 1) {
                delete this._counters[style.id];
                delete this._children[style.id];
                this._keys.splice(index, 1);
                this.sheet.splice(index, 1);
                this.changeId++;
                this.changes.remove(item, index);
            }
            else if (item instanceof Cache && style instanceof Cache) {
                var prevChangeId = item.changeId;
                item.unmerge(style);
                if (item.changeId !== prevChangeId) {
                    this.sheet.splice(index, 1, item.getStyles());
                    this.changeId++;
                    this.changes.change(item, index, index);
                }
            }
        }
    };
    Cache.prototype.merge = function (cache) {
        for (var _i = 0, _a = cache._keys; _i < _a.length; _i++) {
            var id = _a[_i];
            this.add(cache._children[id]);
        }
        return this;
    };
    Cache.prototype.unmerge = function (cache) {
        for (var _i = 0, _a = cache._keys; _i < _a.length; _i++) {
            var id = _a[_i];
            this.remove(cache._children[id]);
        }
        return this;
    };
    Cache.prototype.clone = function () {
        return new Cache(this.hash).merge(this);
    };
    return Cache;
}());
exports.Cache = Cache;
/**
 * Selector is a dumb class made to represent nested CSS selectors.
 */
var Selector = /** @class */ (function () {
    function Selector(selector, hash, id, pid) {
        if (id === void 0) { id = "s" + hash(selector); }
        if (pid === void 0) { pid = ''; }
        this.selector = selector;
        this.hash = hash;
        this.id = id;
        this.pid = pid;
    }
    Selector.prototype.getStyles = function () {
        return this.selector;
    };
    Selector.prototype.getIdentifier = function () {
        return this.pid + "." + this.selector;
    };
    Selector.prototype.clone = function () {
        return new Selector(this.selector, this.hash, this.id, this.pid);
    };
    return Selector;
}());
exports.Selector = Selector;
/**
 * The style container registers a style string with selectors.
 */
var Style = /** @class */ (function (_super) {
    __extends(Style, _super);
    function Style(style, hash, id) {
        if (id === void 0) { id = "c" + hash(style); }
        var _this = _super.call(this, hash) || this;
        _this.style = style;
        _this.hash = hash;
        _this.id = id;
        return _this;
    }
    Style.prototype.getStyles = function () {
        return this.sheet.join(',') + "{" + this.style + "}";
    };
    Style.prototype.getIdentifier = function () {
        return this.style;
    };
    Style.prototype.clone = function () {
        return new Style(this.style, this.hash, this.id).merge(this);
    };
    return Style;
}(Cache));
exports.Style = Style;
/**
 * Implement rule logic for style output.
 */
var Rule = /** @class */ (function (_super) {
    __extends(Rule, _super);
    function Rule(rule, style, hash, id, pid) {
        if (style === void 0) { style = ''; }
        if (id === void 0) { id = "a" + hash(rule + "." + style); }
        if (pid === void 0) { pid = ''; }
        var _this = _super.call(this, hash) || this;
        _this.rule = rule;
        _this.style = style;
        _this.hash = hash;
        _this.id = id;
        _this.pid = pid;
        return _this;
    }
    Rule.prototype.getStyles = function () {
        return this.rule + "{" + this.style + join(this.sheet) + "}";
    };
    Rule.prototype.getIdentifier = function () {
        return this.pid + "." + this.rule + "." + this.style;
    };
    Rule.prototype.clone = function () {
        return new Rule(this.rule, this.style, this.hash, this.id, this.pid).merge(this);
    };
    return Rule;
}(Cache));
exports.Rule = Rule;
/**
 * The FreeStyle class implements the API for everything else.
 */
var FreeStyle = /** @class */ (function (_super) {
    __extends(FreeStyle, _super);
    function FreeStyle(hash, debug, id, changes) {
        if (hash === void 0) { hash = stringHash; }
        if (debug === void 0) { debug = typeof process !== 'undefined' && process.env['NODE_ENV'] !== 'production'; }
        if (id === void 0) { id = "f" + (++uniqueId).toString(36); }
        var _this = _super.call(this, hash, changes) || this;
        _this.hash = hash;
        _this.debug = debug;
        _this.id = id;
        return _this;
    }
    FreeStyle.prototype.registerStyle = function (styles, displayName) {
        var _a = composeStyles(this, '&', styles, true, this.debug ? displayName : undefined), cache = _a.cache, id = _a.id;
        this.merge(cache);
        return id;
    };
    FreeStyle.prototype.registerKeyframes = function (keyframes, displayName) {
        return this.registerHashRule('@keyframes', keyframes, displayName);
    };
    FreeStyle.prototype.registerHashRule = function (prefix, styles, displayName) {
        var _a = composeStyles(this, '', styles, false, this.debug ? displayName : undefined), cache = _a.cache, pid = _a.pid, id = _a.id;
        var rule = new Rule(prefix + " " + id, undefined, this.hash, undefined, pid);
        this.add(rule.merge(cache));
        return id;
    };
    FreeStyle.prototype.registerRule = function (rule, styles) {
        this.merge(composeStyles(this, rule, styles, false).cache);
    };
    FreeStyle.prototype.registerCss = function (styles) {
        this.merge(composeStyles(this, '', styles, false).cache);
    };
    FreeStyle.prototype.getStyles = function () {
        return join(this.sheet);
    };
    FreeStyle.prototype.getIdentifier = function () {
        return this.id;
    };
    FreeStyle.prototype.clone = function () {
        return new FreeStyle(this.hash, this.debug, this.id, this.changes).merge(this);
    };
    return FreeStyle;
}(Cache));
exports.FreeStyle = FreeStyle;
/**
 * Exports a simple function to create a new instance.
 */
function create(hash, debug, changes) {
    return new FreeStyle(hash, debug, undefined, changes);
}
exports.create = create;
//# sourceMappingURL=free-style.js.map
});
return ___scope___.entry = "dist/free-style.js";
});
FuseBox.pkg("process", {}, function(___scope___){
___scope___.file("index.js", function(exports, require, module, __filename, __dirname){

// From https://github.com/defunctzombie/node-process/blob/master/browser.js
// shim for using process in browser
if (FuseBox.isServer) {
    if (typeof __process_env__ !== "undefined") {
        Object.assign(global.process.env, __process_env__);
    }
    module.exports = global.process;
} else {
    // Object assign polyfill
    if (typeof Object.assign != "function") {
        Object.assign = function(target, varArgs) { // .length of function is 2
            "use strict";
            if (target == null) { // TypeError if undefined or null
                throw new TypeError("Cannot convert undefined or null to object");
            }

            var to = Object(target);

            for (var index = 1; index < arguments.length; index++) {
                var nextSource = arguments[index];

                if (nextSource != null) { // Skip over if undefined or null
                    for (var nextKey in nextSource) {
                        // Avoid bugs when hasOwnProperty is shadowed
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        };
    }



    var productionEnv = false; //require('@system-env').production;

    var process = module.exports = {};
    var queue = [];
    var draining = false;
    var currentQueue;
    var queueIndex = -1;

    function cleanUpNextTick() {
        draining = false;
        if (currentQueue.length) {
            queue = currentQueue.concat(queue);
        } else {
            queueIndex = -1;
        }
        if (queue.length) {
            drainQueue();
        }
    }

    function drainQueue() {
        if (draining) {
            return;
        }
        var timeout = setTimeout(cleanUpNextTick);
        draining = true;

        var len = queue.length;
        while (len) {
            currentQueue = queue;
            queue = [];
            while (++queueIndex < len) {
                if (currentQueue) {
                    currentQueue[queueIndex].run();
                }
            }
            queueIndex = -1;
            len = queue.length;
        }
        currentQueue = null;
        draining = false;
        clearTimeout(timeout);
    }

    process.nextTick = function(fun) {
        var args = new Array(arguments.length - 1);
        if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
                args[i - 1] = arguments[i];
            }
        }
        queue.push(new Item(fun, args));
        if (queue.length === 1 && !draining) {
            setTimeout(drainQueue, 0);
        }
    };

    // v8 likes predictible objects
    function Item(fun, array) {
        this.fun = fun;
        this.array = array;
    }
    Item.prototype.run = function() {
        this.fun.apply(null, this.array);
    };
    process.title = "browser";
    process.browser = true;
    process.env = {
        NODE_ENV: productionEnv ? "production" : "development",
    };
    if (typeof __process_env__ !== "undefined") {
        Object.assign(process.env, __process_env__);
    }
    process.argv = [];
    process.version = ""; // empty string to avoid regexp issues
    process.versions = {};

    function noop() {}

    process.on = noop;
    process.addListener = noop;
    process.once = noop;
    process.off = noop;
    process.removeListener = noop;
    process.removeAllListeners = noop;
    process.emit = noop;

    process.binding = function(name) {
        throw new Error("process.binding is not supported");
    };

    process.cwd = function() { return "/"; };
    process.chdir = function(dir) {
        throw new Error("process.chdir is not supported");
    };
    process.umask = function() { return 0; };

}
});
return ___scope___.entry = "index.js";
});
FuseBox.pkg("snabbdom", {}, function(___scope___){
___scope___.file("snabbdom.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vnode_1 = require("./vnode");
var is = require("./is");
var htmldomapi_1 = require("./htmldomapi");
function isUndef(s) { return s === undefined; }
function isDef(s) { return s !== undefined; }
var emptyNode = vnode_1.default('', {}, [], undefined, undefined);
function sameVnode(vnode1, vnode2) {
    return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
}
function isVnode(vnode) {
    return vnode.sel !== undefined;
}
function createKeyToOldIdx(children, beginIdx, endIdx) {
    var i, map = {}, key, ch;
    for (i = beginIdx; i <= endIdx; ++i) {
        ch = children[i];
        if (ch != null) {
            key = ch.key;
            if (key !== undefined)
                map[key] = i;
        }
    }
    return map;
}
var hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];
var h_1 = require("./h");
exports.h = h_1.h;
var thunk_1 = require("./thunk");
exports.thunk = thunk_1.thunk;
function init(modules, domApi) {
    var i, j, cbs = {};
    var api = domApi !== undefined ? domApi : htmldomapi_1.default;
    for (i = 0; i < hooks.length; ++i) {
        cbs[hooks[i]] = [];
        for (j = 0; j < modules.length; ++j) {
            var hook = modules[j][hooks[i]];
            if (hook !== undefined) {
                cbs[hooks[i]].push(hook);
            }
        }
    }
    function emptyNodeAt(elm) {
        var id = elm.id ? '#' + elm.id : '';
        var c = elm.className ? '.' + elm.className.split(' ').join('.') : '';
        return vnode_1.default(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
    }
    function createRmCb(childElm, listeners) {
        return function rmCb() {
            if (--listeners === 0) {
                var parent_1 = api.parentNode(childElm);
                api.removeChild(parent_1, childElm);
            }
        };
    }
    function createElm(vnode, insertedVnodeQueue) {
        var i, data = vnode.data;
        if (data !== undefined) {
            if (isDef(i = data.hook) && isDef(i = i.init)) {
                i(vnode);
                data = vnode.data;
            }
        }
        var children = vnode.children, sel = vnode.sel;
        if (sel === '!') {
            if (isUndef(vnode.text)) {
                vnode.text = '';
            }
            vnode.elm = api.createComment(vnode.text);
        }
        else if (sel !== undefined) {
            // Parse selector
            var hashIdx = sel.indexOf('#');
            var dotIdx = sel.indexOf('.', hashIdx);
            var hash = hashIdx > 0 ? hashIdx : sel.length;
            var dot = dotIdx > 0 ? dotIdx : sel.length;
            var tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
            var elm = vnode.elm = isDef(data) && isDef(i = data.ns) ? api.createElementNS(i, tag)
                : api.createElement(tag);
            if (hash < dot)
                elm.setAttribute('id', sel.slice(hash + 1, dot));
            if (dotIdx > 0)
                elm.setAttribute('class', sel.slice(dot + 1).replace(/\./g, ' '));
            for (i = 0; i < cbs.create.length; ++i)
                cbs.create[i](emptyNode, vnode);
            if (is.array(children)) {
                for (i = 0; i < children.length; ++i) {
                    var ch = children[i];
                    if (ch != null) {
                        api.appendChild(elm, createElm(ch, insertedVnodeQueue));
                    }
                }
            }
            else if (is.primitive(vnode.text)) {
                api.appendChild(elm, api.createTextNode(vnode.text));
            }
            i = vnode.data.hook; // Reuse variable
            if (isDef(i)) {
                if (i.create)
                    i.create(emptyNode, vnode);
                if (i.insert)
                    insertedVnodeQueue.push(vnode);
            }
        }
        else {
            vnode.elm = api.createTextNode(vnode.text);
        }
        return vnode.elm;
    }
    function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
        for (; startIdx <= endIdx; ++startIdx) {
            var ch = vnodes[startIdx];
            if (ch != null) {
                api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
            }
        }
    }
    function invokeDestroyHook(vnode) {
        var i, j, data = vnode.data;
        if (data !== undefined) {
            if (isDef(i = data.hook) && isDef(i = i.destroy))
                i(vnode);
            for (i = 0; i < cbs.destroy.length; ++i)
                cbs.destroy[i](vnode);
            if (vnode.children !== undefined) {
                for (j = 0; j < vnode.children.length; ++j) {
                    i = vnode.children[j];
                    if (i != null && typeof i !== "string") {
                        invokeDestroyHook(i);
                    }
                }
            }
        }
    }
    function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
        for (; startIdx <= endIdx; ++startIdx) {
            var i_1 = void 0, listeners = void 0, rm = void 0, ch = vnodes[startIdx];
            if (ch != null) {
                if (isDef(ch.sel)) {
                    invokeDestroyHook(ch);
                    listeners = cbs.remove.length + 1;
                    rm = createRmCb(ch.elm, listeners);
                    for (i_1 = 0; i_1 < cbs.remove.length; ++i_1)
                        cbs.remove[i_1](ch, rm);
                    if (isDef(i_1 = ch.data) && isDef(i_1 = i_1.hook) && isDef(i_1 = i_1.remove)) {
                        i_1(ch, rm);
                    }
                    else {
                        rm();
                    }
                }
                else {
                    api.removeChild(parentElm, ch.elm);
                }
            }
        }
    }
    function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
        var oldStartIdx = 0, newStartIdx = 0;
        var oldEndIdx = oldCh.length - 1;
        var oldStartVnode = oldCh[0];
        var oldEndVnode = oldCh[oldEndIdx];
        var newEndIdx = newCh.length - 1;
        var newStartVnode = newCh[0];
        var newEndVnode = newCh[newEndIdx];
        var oldKeyToIdx;
        var idxInOld;
        var elmToMove;
        var before;
        while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
            if (oldStartVnode == null) {
                oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
            }
            else if (oldEndVnode == null) {
                oldEndVnode = oldCh[--oldEndIdx];
            }
            else if (newStartVnode == null) {
                newStartVnode = newCh[++newStartIdx];
            }
            else if (newEndVnode == null) {
                newEndVnode = newCh[--newEndIdx];
            }
            else if (sameVnode(oldStartVnode, newStartVnode)) {
                patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
                oldStartVnode = oldCh[++oldStartIdx];
                newStartVnode = newCh[++newStartIdx];
            }
            else if (sameVnode(oldEndVnode, newEndVnode)) {
                patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
                oldEndVnode = oldCh[--oldEndIdx];
                newEndVnode = newCh[--newEndIdx];
            }
            else if (sameVnode(oldStartVnode, newEndVnode)) {
                patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
                api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
                oldStartVnode = oldCh[++oldStartIdx];
                newEndVnode = newCh[--newEndIdx];
            }
            else if (sameVnode(oldEndVnode, newStartVnode)) {
                patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
                api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
                oldEndVnode = oldCh[--oldEndIdx];
                newStartVnode = newCh[++newStartIdx];
            }
            else {
                if (oldKeyToIdx === undefined) {
                    oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
                }
                idxInOld = oldKeyToIdx[newStartVnode.key];
                if (isUndef(idxInOld)) {
                    api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                    newStartVnode = newCh[++newStartIdx];
                }
                else {
                    elmToMove = oldCh[idxInOld];
                    if (elmToMove.sel !== newStartVnode.sel) {
                        api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                    }
                    else {
                        patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
                        oldCh[idxInOld] = undefined;
                        api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
                    }
                    newStartVnode = newCh[++newStartIdx];
                }
            }
        }
        if (oldStartIdx > oldEndIdx) {
            before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
            addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
        }
        else if (newStartIdx > newEndIdx) {
            removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
        }
    }
    function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
        var i, hook;
        if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
            i(oldVnode, vnode);
        }
        var elm = vnode.elm = oldVnode.elm;
        var oldCh = oldVnode.children;
        var ch = vnode.children;
        if (oldVnode === vnode)
            return;
        if (vnode.data !== undefined) {
            for (i = 0; i < cbs.update.length; ++i)
                cbs.update[i](oldVnode, vnode);
            i = vnode.data.hook;
            if (isDef(i) && isDef(i = i.update))
                i(oldVnode, vnode);
        }
        if (isUndef(vnode.text)) {
            if (isDef(oldCh) && isDef(ch)) {
                if (oldCh !== ch)
                    updateChildren(elm, oldCh, ch, insertedVnodeQueue);
            }
            else if (isDef(ch)) {
                if (isDef(oldVnode.text))
                    api.setTextContent(elm, '');
                addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
            }
            else if (isDef(oldCh)) {
                removeVnodes(elm, oldCh, 0, oldCh.length - 1);
            }
            else if (isDef(oldVnode.text)) {
                api.setTextContent(elm, '');
            }
        }
        else if (oldVnode.text !== vnode.text) {
            api.setTextContent(elm, vnode.text);
        }
        if (isDef(hook) && isDef(i = hook.postpatch)) {
            i(oldVnode, vnode);
        }
    }
    return function patch(oldVnode, vnode) {
        var i, elm, parent;
        var insertedVnodeQueue = [];
        for (i = 0; i < cbs.pre.length; ++i)
            cbs.pre[i]();
        if (!isVnode(oldVnode)) {
            oldVnode = emptyNodeAt(oldVnode);
        }
        if (sameVnode(oldVnode, vnode)) {
            patchVnode(oldVnode, vnode, insertedVnodeQueue);
        }
        else {
            elm = oldVnode.elm;
            parent = api.parentNode(elm);
            createElm(vnode, insertedVnodeQueue);
            if (parent !== null) {
                api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
                removeVnodes(parent, [oldVnode], 0, 0);
            }
        }
        for (i = 0; i < insertedVnodeQueue.length; ++i) {
            insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
        }
        for (i = 0; i < cbs.post.length; ++i)
            cbs.post[i]();
        return vnode;
    };
}
exports.init = init;
//# sourceMappingURL=snabbdom.js.map
});
___scope___.file("vnode.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function vnode(sel, data, children, text, elm) {
    var key = data === undefined ? undefined : data.key;
    return { sel: sel, data: data, children: children,
        text: text, elm: elm, key: key };
}
exports.vnode = vnode;
exports.default = vnode;
//# sourceMappingURL=vnode.js.map
});
___scope___.file("is.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.array = Array.isArray;
function primitive(s) {
    return typeof s === 'string' || typeof s === 'number';
}
exports.primitive = primitive;
//# sourceMappingURL=is.js.map
});
___scope___.file("htmldomapi.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createElement(tagName) {
    return document.createElement(tagName);
}
function createElementNS(namespaceURI, qualifiedName) {
    return document.createElementNS(namespaceURI, qualifiedName);
}
function createTextNode(text) {
    return document.createTextNode(text);
}
function createComment(text) {
    return document.createComment(text);
}
function insertBefore(parentNode, newNode, referenceNode) {
    parentNode.insertBefore(newNode, referenceNode);
}
function removeChild(node, child) {
    node.removeChild(child);
}
function appendChild(node, child) {
    node.appendChild(child);
}
function parentNode(node) {
    return node.parentNode;
}
function nextSibling(node) {
    return node.nextSibling;
}
function tagName(elm) {
    return elm.tagName;
}
function setTextContent(node, text) {
    node.textContent = text;
}
function getTextContent(node) {
    return node.textContent;
}
function isElement(node) {
    return node.nodeType === 1;
}
function isText(node) {
    return node.nodeType === 3;
}
function isComment(node) {
    return node.nodeType === 8;
}
exports.htmlDomApi = {
    createElement: createElement,
    createElementNS: createElementNS,
    createTextNode: createTextNode,
    createComment: createComment,
    insertBefore: insertBefore,
    removeChild: removeChild,
    appendChild: appendChild,
    parentNode: parentNode,
    nextSibling: nextSibling,
    tagName: tagName,
    setTextContent: setTextContent,
    getTextContent: getTextContent,
    isElement: isElement,
    isText: isText,
    isComment: isComment,
};
exports.default = exports.htmlDomApi;
//# sourceMappingURL=htmldomapi.js.map
});
___scope___.file("h.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vnode_1 = require("./vnode");
var is = require("./is");
function addNS(data, children, sel) {
    data.ns = 'http://www.w3.org/2000/svg';
    if (sel !== 'foreignObject' && children !== undefined) {
        for (var i = 0; i < children.length; ++i) {
            var childData = children[i].data;
            if (childData !== undefined) {
                addNS(childData, children[i].children, children[i].sel);
            }
        }
    }
}
function h(sel, b, c) {
    var data = {}, children, text, i;
    if (c !== undefined) {
        data = b;
        if (is.array(c)) {
            children = c;
        }
        else if (is.primitive(c)) {
            text = c;
        }
        else if (c && c.sel) {
            children = [c];
        }
    }
    else if (b !== undefined) {
        if (is.array(b)) {
            children = b;
        }
        else if (is.primitive(b)) {
            text = b;
        }
        else if (b && b.sel) {
            children = [b];
        }
        else {
            data = b;
        }
    }
    if (is.array(children)) {
        for (i = 0; i < children.length; ++i) {
            if (is.primitive(children[i]))
                children[i] = vnode_1.vnode(undefined, undefined, undefined, children[i]);
        }
    }
    if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g' &&
        (sel.length === 3 || sel[3] === '.' || sel[3] === '#')) {
        addNS(data, children, sel);
    }
    return vnode_1.vnode(sel, data, children, text, undefined);
}
exports.h = h;
;
exports.default = h;
//# sourceMappingURL=h.js.map
});
___scope___.file("thunk.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var h_1 = require("./h");
function copyToThunk(vnode, thunk) {
    thunk.elm = vnode.elm;
    vnode.data.fn = thunk.data.fn;
    vnode.data.args = thunk.data.args;
    thunk.data = vnode.data;
    thunk.children = vnode.children;
    thunk.text = vnode.text;
    thunk.elm = vnode.elm;
}
function init(thunk) {
    var cur = thunk.data;
    var vnode = cur.fn.apply(undefined, cur.args);
    copyToThunk(vnode, thunk);
}
function prepatch(oldVnode, thunk) {
    var i, old = oldVnode.data, cur = thunk.data;
    var oldArgs = old.args, args = cur.args;
    if (old.fn !== cur.fn || oldArgs.length !== args.length) {
        copyToThunk(cur.fn.apply(undefined, args), thunk);
        return;
    }
    for (i = 0; i < args.length; ++i) {
        if (oldArgs[i] !== args[i]) {
            copyToThunk(cur.fn.apply(undefined, args), thunk);
            return;
        }
    }
    copyToThunk(oldVnode, thunk);
}
exports.thunk = function thunk(sel, key, fn, args) {
    if (args === undefined) {
        args = fn;
        fn = key;
        key = undefined;
    }
    return h_1.h(sel, {
        key: key,
        hook: { init: init, prepatch: prepatch },
        fn: fn,
        args: args
    });
};
exports.default = exports.thunk;
//# sourceMappingURL=thunk.js.map
});
___scope___.file("modules/class.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function updateClass(oldVnode, vnode) {
    var cur, name, elm = vnode.elm, oldClass = oldVnode.data.class, klass = vnode.data.class;
    if (!oldClass && !klass)
        return;
    if (oldClass === klass)
        return;
    oldClass = oldClass || {};
    klass = klass || {};
    for (name in oldClass) {
        if (!klass[name]) {
            elm.classList.remove(name);
        }
    }
    for (name in klass) {
        cur = klass[name];
        if (cur !== oldClass[name]) {
            elm.classList[cur ? 'add' : 'remove'](name);
        }
    }
}
exports.classModule = { create: updateClass, update: updateClass };
exports.default = exports.classModule;
//# sourceMappingURL=class.js.map
});
___scope___.file("modules/attributes.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var booleanAttrs = ["allowfullscreen", "async", "autofocus", "autoplay", "checked", "compact", "controls", "declare",
    "default", "defaultchecked", "defaultmuted", "defaultselected", "defer", "disabled", "draggable",
    "enabled", "formnovalidate", "hidden", "indeterminate", "inert", "ismap", "itemscope", "loop", "multiple",
    "muted", "nohref", "noresize", "noshade", "novalidate", "nowrap", "open", "pauseonexit", "readonly",
    "required", "reversed", "scoped", "seamless", "selected", "sortable", "spellcheck", "translate",
    "truespeed", "typemustmatch", "visible"];
var xlinkNS = 'http://www.w3.org/1999/xlink';
var xmlNS = 'http://www.w3.org/XML/1998/namespace';
var colonChar = 58;
var xChar = 120;
var booleanAttrsDict = Object.create(null);
for (var i = 0, len = booleanAttrs.length; i < len; i++) {
    booleanAttrsDict[booleanAttrs[i]] = true;
}
function updateAttrs(oldVnode, vnode) {
    var key, elm = vnode.elm, oldAttrs = oldVnode.data.attrs, attrs = vnode.data.attrs;
    if (!oldAttrs && !attrs)
        return;
    if (oldAttrs === attrs)
        return;
    oldAttrs = oldAttrs || {};
    attrs = attrs || {};
    // update modified attributes, add new attributes
    for (key in attrs) {
        var cur = attrs[key];
        var old = oldAttrs[key];
        if (old !== cur) {
            if (booleanAttrsDict[key]) {
                if (cur) {
                    elm.setAttribute(key, "");
                }
                else {
                    elm.removeAttribute(key);
                }
            }
            else {
                if (key.charCodeAt(0) !== xChar) {
                    elm.setAttribute(key, cur);
                }
                else if (key.charCodeAt(3) === colonChar) {
                    // Assume xml namespace
                    elm.setAttributeNS(xmlNS, key, cur);
                }
                else if (key.charCodeAt(5) === colonChar) {
                    // Assume xlink namespace
                    elm.setAttributeNS(xlinkNS, key, cur);
                }
                else {
                    elm.setAttribute(key, cur);
                }
            }
        }
    }
    // remove removed attributes
    // use `in` operator since the previous `for` iteration uses it (.i.e. add even attributes with undefined value)
    // the other option is to remove all attributes with value == undefined
    for (key in oldAttrs) {
        if (!(key in attrs)) {
            elm.removeAttribute(key);
        }
    }
}
exports.attributesModule = { create: updateAttrs, update: updateAttrs };
exports.default = exports.attributesModule;
//# sourceMappingURL=attributes.js.map
});
___scope___.file("modules/props.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function updateProps(oldVnode, vnode) {
    var key, cur, old, elm = vnode.elm, oldProps = oldVnode.data.props, props = vnode.data.props;
    if (!oldProps && !props)
        return;
    if (oldProps === props)
        return;
    oldProps = oldProps || {};
    props = props || {};
    for (key in oldProps) {
        if (!props[key]) {
            delete elm[key];
        }
    }
    for (key in props) {
        cur = props[key];
        old = oldProps[key];
        if (old !== cur && (key !== 'value' || elm[key] !== cur)) {
            elm[key] = cur;
        }
    }
}
exports.propsModule = { create: updateProps, update: updateProps };
exports.default = exports.propsModule;
//# sourceMappingURL=props.js.map
});
___scope___.file("modules/style.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var raf = (typeof window !== 'undefined' && window.requestAnimationFrame) || setTimeout;
var nextFrame = function (fn) { raf(function () { raf(fn); }); };
function setNextFrame(obj, prop, val) {
    nextFrame(function () { obj[prop] = val; });
}
function updateStyle(oldVnode, vnode) {
    var cur, name, elm = vnode.elm, oldStyle = oldVnode.data.style, style = vnode.data.style;
    if (!oldStyle && !style)
        return;
    if (oldStyle === style)
        return;
    oldStyle = oldStyle || {};
    style = style || {};
    var oldHasDel = 'delayed' in oldStyle;
    for (name in oldStyle) {
        if (!style[name]) {
            if (name[0] === '-' && name[1] === '-') {
                elm.style.removeProperty(name);
            }
            else {
                elm.style[name] = '';
            }
        }
    }
    for (name in style) {
        cur = style[name];
        if (name === 'delayed' && style.delayed) {
            for (var name2 in style.delayed) {
                cur = style.delayed[name2];
                if (!oldHasDel || cur !== oldStyle.delayed[name2]) {
                    setNextFrame(elm.style, name2, cur);
                }
            }
        }
        else if (name !== 'remove' && cur !== oldStyle[name]) {
            if (name[0] === '-' && name[1] === '-') {
                elm.style.setProperty(name, cur);
            }
            else {
                elm.style[name] = cur;
            }
        }
    }
}
function applyDestroyStyle(vnode) {
    var style, name, elm = vnode.elm, s = vnode.data.style;
    if (!s || !(style = s.destroy))
        return;
    for (name in style) {
        elm.style[name] = style[name];
    }
}
function applyRemoveStyle(vnode, rm) {
    var s = vnode.data.style;
    if (!s || !s.remove) {
        rm();
        return;
    }
    var name, elm = vnode.elm, i = 0, compStyle, style = s.remove, amount = 0, applied = [];
    for (name in style) {
        applied.push(name);
        elm.style[name] = style[name];
    }
    compStyle = getComputedStyle(elm);
    var props = compStyle['transition-property'].split(', ');
    for (; i < props.length; ++i) {
        if (applied.indexOf(props[i]) !== -1)
            amount++;
    }
    elm.addEventListener('transitionend', function (ev) {
        if (ev.target === elm)
            --amount;
        if (amount === 0)
            rm();
    });
}
exports.styleModule = {
    create: updateStyle,
    update: updateStyle,
    destroy: applyDestroyStyle,
    remove: applyRemoveStyle
};
exports.default = exports.styleModule;
//# sourceMappingURL=style.js.map
});
return ___scope___.entry = "snabbdom.js";
});
FuseBox.pkg("buffer", {}, function(___scope___){
___scope___.file("index.js", function(exports, require, module, __filename, __dirname){

if (FuseBox.isServer) {

    module.exports = global.require("buffer");
} else {
    /*!
     * The buffer module from node.js, for the browser.
     *
     * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
     * @license  MIT
     */
    /* eslint-disable no-proto */

    "use strict";

    var base64 = require("base64-js");
    var ieee754 = require("ieee754");

    exports.Buffer = Buffer;
    exports.FuseShim = true;
    exports.SlowBuffer = SlowBuffer;
    exports.INSPECT_MAX_BYTES = 50;

    var K_MAX_LENGTH = 0x7fffffff;
    exports.kMaxLength = K_MAX_LENGTH;

    /**
     * If `Buffer.TYPED_ARRAY_SUPPORT`:
     *   === true    Use Uint8Array implementation (fastest)
     *   === false   Print warning and recommend using `buffer` v4.x which has an Object
     *               implementation (most compatible, even IE6)
     *
     * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
     * Opera 11.6+, iOS 4.2+.
     *
     * We report that the browser does not support typed arrays if the are not subclassable
     * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
     * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
     * for __proto__ and has a buggy typed array implementation.
     */
    Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport();

    if (!Buffer.TYPED_ARRAY_SUPPORT) {
        console.error(
            "This browser lacks typed array (Uint8Array) support which is required by " +
            "`buffer` v5.x. Use `buffer` v4.x if you require old browser support.");
    }

    function typedArraySupport() {
        // Can typed array instances can be augmented?
        try {
            var arr = new Uint8Array(1);
            arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function() { return 42; } };
            return arr.foo() === 42;
        } catch (e) {
            return false;
        }
    }

    function createBuffer(length) {
        if (length > K_MAX_LENGTH) {
            throw new RangeError("Invalid typed array length");
        }
        // Return an augmented `Uint8Array` instance
        var buf = new Uint8Array(length);
        buf.__proto__ = Buffer.prototype;
        return buf;
    }

    /**
     * The Buffer constructor returns instances of `Uint8Array` that have their
     * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
     * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
     * and the `Uint8Array` methods. Square bracket notation works as expected -- it
     * returns a single octet.
     *
     * The `Uint8Array` prototype remains unmodified.
     */

    function Buffer(arg, encodingOrOffset, length) {
        // Common case.
        if (typeof arg === "number") {
            if (typeof encodingOrOffset === "string") {
                throw new Error(
                    "If encoding is specified then the first argument must be a string"
                );
            }
            return allocUnsafe(arg);
        }
        return from(arg, encodingOrOffset, length);
    }

    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    if (typeof Symbol !== "undefined" && Symbol.species &&
        Buffer[Symbol.species] === Buffer) {
        Object.defineProperty(Buffer, Symbol.species, {
            value: null,
            configurable: true,
            enumerable: false,
            writable: false,
        });
    }

    Buffer.poolSize = 8192; // not used by this implementation

    function from(value, encodingOrOffset, length) {
        if (typeof value === "number") {
            throw new TypeError("\"value\" argument must not be a number");
        }

        if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) {
            return fromArrayBuffer(value, encodingOrOffset, length);
        }

        if (typeof value === "string") {
            return fromString(value, encodingOrOffset);
        }

        return fromObject(value);
    }

    /**
     * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
     * if value is a number.
     * Buffer.from(str[, encoding])
     * Buffer.from(array)
     * Buffer.from(buffer)
     * Buffer.from(arrayBuffer[, byteOffset[, length]])
     **/
    Buffer.from = function(value, encodingOrOffset, length) {
        return from(value, encodingOrOffset, length);
    };

    // Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
    // https://github.com/feross/buffer/pull/148
    Buffer.prototype.__proto__ = Uint8Array.prototype;
    Buffer.__proto__ = Uint8Array;

    function assertSize(size) {
        if (typeof size !== "number") {
            throw new TypeError("\"size\" argument must be a number");
        } else if (size < 0) {
            throw new RangeError("\"size\" argument must not be negative");
        }
    }

    function alloc(size, fill, encoding) {
        assertSize(size);
        if (size <= 0) {
            return createBuffer(size);
        }
        if (fill !== undefined) {
            // Only pay attention to encoding if it's a string. This
            // prevents accidentally sending in a number that would
            // be interpretted as a start offset.
            return typeof encoding === "string" ?
                createBuffer(size).fill(fill, encoding) :
                createBuffer(size).fill(fill);
        }
        return createBuffer(size);
    }

    /**
     * Creates a new filled Buffer instance.
     * alloc(size[, fill[, encoding]])
     **/
    Buffer.alloc = function(size, fill, encoding) {
        return alloc(size, fill, encoding);
    };

    function allocUnsafe(size) {
        assertSize(size);
        return createBuffer(size < 0 ? 0 : checked(size) | 0);
    }

    /**
     * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
     * */
    Buffer.allocUnsafe = function(size) {
        return allocUnsafe(size);
    };
    /**
     * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
     */
    Buffer.allocUnsafeSlow = function(size) {
        return allocUnsafe(size);
    };

    function fromString(string, encoding) {
        if (typeof encoding !== "string" || encoding === "") {
            encoding = "utf8";
        }

        if (!Buffer.isEncoding(encoding)) {
            throw new TypeError("\"encoding\" must be a valid string encoding");
        }

        var length = byteLength(string, encoding) | 0;
        var buf = createBuffer(length);

        var actual = buf.write(string, encoding);

        if (actual !== length) {
            // Writing a hex string, for example, that contains invalid characters will
            // cause everything after the first invalid character to be ignored. (e.g.
            // 'abxxcd' will be treated as 'ab')
            buf = buf.slice(0, actual);
        }

        return buf;
    }

    function fromArrayLike(array) {
        var length = array.length < 0 ? 0 : checked(array.length) | 0;
        var buf = createBuffer(length);
        for (var i = 0; i < length; i += 1) {
            buf[i] = array[i] & 255;
        }
        return buf;
    }

    function fromArrayBuffer(array, byteOffset, length) {
        array.byteLength; // this throws if `array` is not a valid ArrayBuffer

        if (byteOffset < 0 || array.byteLength < byteOffset) {
            throw new RangeError("'offset' is out of bounds");
        }

        if (array.byteLength < byteOffset + (length || 0)) {
            throw new RangeError("'length' is out of bounds");
        }

        var buf;
        if (byteOffset === undefined && length === undefined) {
            buf = new Uint8Array(array);
        } else if (length === undefined) {
            buf = new Uint8Array(array, byteOffset);
        } else {
            buf = new Uint8Array(array, byteOffset, length);
        }

        // Return an augmented `Uint8Array` instance
        buf.__proto__ = Buffer.prototype;
        return buf;
    }

    function fromObject(obj) {
        if (Buffer.isBuffer(obj)) {
            var len = checked(obj.length) | 0;
            var buf = createBuffer(len);

            if (buf.length === 0) {
                return buf;
            }

            obj.copy(buf, 0, 0, len);
            return buf;
        }

        if (obj) {
            if ((typeof ArrayBuffer !== "undefined" &&
                    obj.buffer instanceof ArrayBuffer) || "length" in obj) {
                if (typeof obj.length !== "number" || isnan(obj.length)) {
                    return createBuffer(0);
                }
                return fromArrayLike(obj);
            }

            if (obj.type === "Buffer" && Array.isArray(obj.data)) {
                return fromArrayLike(obj.data);
            }
        }

        throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");
    }

    function checked(length) {
        // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
        // length is NaN (which is otherwise coerced to zero.)
        if (length >= K_MAX_LENGTH) {
            throw new RangeError("Attempt to allocate Buffer larger than maximum " +
                "size: 0x" + K_MAX_LENGTH.toString(16) + " bytes");
        }
        return length | 0;
    }

    function SlowBuffer(length) {
        if (+length != length) { // eslint-disable-line eqeqeq
            length = 0;
        }
        return Buffer.alloc(+length);
    }

    Buffer.isBuffer = function isBuffer(b) {
        return !!(b != null && b._isBuffer);
    };

    Buffer.compare = function compare(a, b) {
        if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
            throw new TypeError("Arguments must be Buffers");
        }

        if (a === b) return 0;

        var x = a.length;
        var y = b.length;

        for (var i = 0, len = Math.min(x, y); i < len; ++i) {
            if (a[i] !== b[i]) {
                x = a[i];
                y = b[i];
                break;
            }
        }

        if (x < y) return -1;
        if (y < x) return 1;
        return 0;
    };

    Buffer.isEncoding = function isEncoding(encoding) {
        switch (String(encoding).toLowerCase()) {
            case "hex":
            case "utf8":
            case "utf-8":
            case "ascii":
            case "latin1":
            case "binary":
            case "base64":
            case "ucs2":
            case "ucs-2":
            case "utf16le":
            case "utf-16le":
                return true;
            default:
                return false;
        }
    };

    Buffer.concat = function concat(list, length) {
        if (!Array.isArray(list)) {
            throw new TypeError("\"list\" argument must be an Array of Buffers");
        }

        if (list.length === 0) {
            return Buffer.alloc(0);
        }

        var i;
        if (length === undefined) {
            length = 0;
            for (i = 0; i < list.length; ++i) {
                length += list[i].length;
            }
        }

        var buffer = Buffer.allocUnsafe(length);
        var pos = 0;
        for (i = 0; i < list.length; ++i) {
            var buf = list[i];
            if (!Buffer.isBuffer(buf)) {
                throw new TypeError("\"list\" argument must be an Array of Buffers");
            }
            buf.copy(buffer, pos);
            pos += buf.length;
        }
        return buffer;
    };

    function byteLength(string, encoding) {
        if (Buffer.isBuffer(string)) {
            return string.length;
        }
        if (typeof ArrayBuffer !== "undefined" && typeof ArrayBuffer.isView === "function" &&
            (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
            return string.byteLength;
        }
        if (typeof string !== "string") {
            string = "" + string;
        }

        var len = string.length;
        if (len === 0) return 0;

        // Use a for loop to avoid recursion
        var loweredCase = false;
        for (;;) {
            switch (encoding) {
                case "ascii":
                case "latin1":
                case "binary":
                    return len;
                case "utf8":
                case "utf-8":
                case undefined:
                    return utf8ToBytes(string).length;
                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                    return len * 2;
                case "hex":
                    return len >>> 1;
                case "base64":
                    return base64ToBytes(string).length;
                default:
                    if (loweredCase) return utf8ToBytes(string).length; // assume utf8
                    encoding = ("" + encoding).toLowerCase();
                    loweredCase = true;
            }
        }
    }
    Buffer.byteLength = byteLength;

    function slowToString(encoding, start, end) {
        var loweredCase = false;

        // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
        // property of a typed array.

        // This behaves neither like String nor Uint8Array in that we set start/end
        // to their upper/lower bounds if the value passed is out of range.
        // undefined is handled specially as per ECMA-262 6th Edition,
        // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
        if (start === undefined || start < 0) {
            start = 0;
        }
        // Return early if start > this.length. Done here to prevent potential uint32
        // coercion fail below.
        if (start > this.length) {
            return "";
        }

        if (end === undefined || end > this.length) {
            end = this.length;
        }

        if (end <= 0) {
            return "";
        }

        // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
        end >>>= 0;
        start >>>= 0;

        if (end <= start) {
            return "";
        }

        if (!encoding) encoding = "utf8";

        while (true) {
            switch (encoding) {
                case "hex":
                    return hexSlice(this, start, end);

                case "utf8":
                case "utf-8":
                    return utf8Slice(this, start, end);

                case "ascii":
                    return asciiSlice(this, start, end);

                case "latin1":
                case "binary":
                    return latin1Slice(this, start, end);

                case "base64":
                    return base64Slice(this, start, end);

                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                    return utf16leSlice(this, start, end);

                default:
                    if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
                    encoding = (encoding + "").toLowerCase();
                    loweredCase = true;
            }
        }
    }

    // The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
    // Buffer instances.
    Buffer.prototype._isBuffer = true;

    function swap(b, n, m) {
        var i = b[n];
        b[n] = b[m];
        b[m] = i;
    }

    Buffer.prototype.swap16 = function swap16() {
        var len = this.length;
        if (len % 2 !== 0) {
            throw new RangeError("Buffer size must be a multiple of 16-bits");
        }
        for (var i = 0; i < len; i += 2) {
            swap(this, i, i + 1);
        }
        return this;
    };

    Buffer.prototype.swap32 = function swap32() {
        var len = this.length;
        if (len % 4 !== 0) {
            throw new RangeError("Buffer size must be a multiple of 32-bits");
        }
        for (var i = 0; i < len; i += 4) {
            swap(this, i, i + 3);
            swap(this, i + 1, i + 2);
        }
        return this;
    };

    Buffer.prototype.swap64 = function swap64() {
        var len = this.length;
        if (len % 8 !== 0) {
            throw new RangeError("Buffer size must be a multiple of 64-bits");
        }
        for (var i = 0; i < len; i += 8) {
            swap(this, i, i + 7);
            swap(this, i + 1, i + 6);
            swap(this, i + 2, i + 5);
            swap(this, i + 3, i + 4);
        }
        return this;
    };

    Buffer.prototype.toString = function toString() {
        var length = this.length;
        if (length === 0) return "";
        if (arguments.length === 0) return utf8Slice(this, 0, length);
        return slowToString.apply(this, arguments);
    };

    Buffer.prototype.equals = function equals(b) {
        if (!Buffer.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
        if (this === b) return true;
        return Buffer.compare(this, b) === 0;
    };

    Buffer.prototype.inspect = function inspect() {
        var str = "";
        var max = exports.INSPECT_MAX_BYTES;
        if (this.length > 0) {
            str = this.toString("hex", 0, max).match(/.{2}/g).join(" ");
            if (this.length > max) str += " ... ";
        }
        return "<Buffer " + str + ">";
    };

    Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
        if (!Buffer.isBuffer(target)) {
            throw new TypeError("Argument must be a Buffer");
        }

        if (start === undefined) {
            start = 0;
        }
        if (end === undefined) {
            end = target ? target.length : 0;
        }
        if (thisStart === undefined) {
            thisStart = 0;
        }
        if (thisEnd === undefined) {
            thisEnd = this.length;
        }

        if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
            throw new RangeError("out of range index");
        }

        if (thisStart >= thisEnd && start >= end) {
            return 0;
        }
        if (thisStart >= thisEnd) {
            return -1;
        }
        if (start >= end) {
            return 1;
        }

        start >>>= 0;
        end >>>= 0;
        thisStart >>>= 0;
        thisEnd >>>= 0;

        if (this === target) return 0;

        var x = thisEnd - thisStart;
        var y = end - start;
        var len = Math.min(x, y);

        var thisCopy = this.slice(thisStart, thisEnd);
        var targetCopy = target.slice(start, end);

        for (var i = 0; i < len; ++i) {
            if (thisCopy[i] !== targetCopy[i]) {
                x = thisCopy[i];
                y = targetCopy[i];
                break;
            }
        }

        if (x < y) return -1;
        if (y < x) return 1;
        return 0;
    };

    // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
    // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
    //
    // Arguments:
    // - buffer - a Buffer to search
    // - val - a string, Buffer, or number
    // - byteOffset - an index into `buffer`; will be clamped to an int32
    // - encoding - an optional encoding, relevant is val is a string
    // - dir - true for indexOf, false for lastIndexOf
    function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
        // Empty buffer means no match
        if (buffer.length === 0) return -1;

        // Normalize byteOffset
        if (typeof byteOffset === "string") {
            encoding = byteOffset;
            byteOffset = 0;
        } else if (byteOffset > 0x7fffffff) {
            byteOffset = 0x7fffffff;
        } else if (byteOffset < -0x80000000) {
            byteOffset = -0x80000000;
        }
        byteOffset = +byteOffset; // Coerce to Number.
        if (isNaN(byteOffset)) {
            // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
            byteOffset = dir ? 0 : (buffer.length - 1);
        }

        // Normalize byteOffset: negative offsets start from the end of the buffer
        if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
        if (byteOffset >= buffer.length) {
            if (dir) return -1;
            else byteOffset = buffer.length - 1;
        } else if (byteOffset < 0) {
            if (dir) byteOffset = 0;
            else return -1;
        }

        // Normalize val
        if (typeof val === "string") {
            val = Buffer.from(val, encoding);
        }

        // Finally, search either indexOf (if dir is true) or lastIndexOf
        if (Buffer.isBuffer(val)) {
            // Special case: looking for empty string/buffer always fails
            if (val.length === 0) {
                return -1;
            }
            return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
        } else if (typeof val === "number") {
            val = val & 0xFF; // Search for a byte value [0-255]
            if (typeof Uint8Array.prototype.indexOf === "function") {
                if (dir) {
                    return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
                } else {
                    return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
                }
            }
            return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
        }

        throw new TypeError("val must be string, number or Buffer");
    }

    function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
        var indexSize = 1;
        var arrLength = arr.length;
        var valLength = val.length;

        if (encoding !== undefined) {
            encoding = String(encoding).toLowerCase();
            if (encoding === "ucs2" || encoding === "ucs-2" ||
                encoding === "utf16le" || encoding === "utf-16le") {
                if (arr.length < 2 || val.length < 2) {
                    return -1;
                }
                indexSize = 2;
                arrLength /= 2;
                valLength /= 2;
                byteOffset /= 2;
            }
        }

        function read(buf, i) {
            if (indexSize === 1) {
                return buf[i];
            } else {
                return buf.readUInt16BE(i * indexSize);
            }
        }

        var i;
        if (dir) {
            var foundIndex = -1;
            for (i = byteOffset; i < arrLength; i++) {
                if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
                    if (foundIndex === -1) foundIndex = i;
                    if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
                } else {
                    if (foundIndex !== -1) i -= i - foundIndex;
                    foundIndex = -1;
                }
            }
        } else {
            if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
            for (i = byteOffset; i >= 0; i--) {
                var found = true;
                for (var j = 0; j < valLength; j++) {
                    if (read(arr, i + j) !== read(val, j)) {
                        found = false;
                        break;
                    }
                }
                if (found) return i;
            }
        }

        return -1;
    }

    Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
        return this.indexOf(val, byteOffset, encoding) !== -1;
    };

    Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
    };

    Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
        return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
    };

    function hexWrite(buf, string, offset, length) {
        offset = Number(offset) || 0;
        var remaining = buf.length - offset;
        if (!length) {
            length = remaining;
        } else {
            length = Number(length);
            if (length > remaining) {
                length = remaining;
            }
        }

        // must be an even number of digits
        var strLen = string.length;
        if (strLen % 2 !== 0) throw new TypeError("Invalid hex string");

        if (length > strLen / 2) {
            length = strLen / 2;
        }
        for (var i = 0; i < length; ++i) {
            var parsed = parseInt(string.substr(i * 2, 2), 16);
            if (isNaN(parsed)) return i;
            buf[offset + i] = parsed;
        }
        return i;
    }

    function utf8Write(buf, string, offset, length) {
        return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
    }

    function asciiWrite(buf, string, offset, length) {
        return blitBuffer(asciiToBytes(string), buf, offset, length);
    }

    function latin1Write(buf, string, offset, length) {
        return asciiWrite(buf, string, offset, length);
    }

    function base64Write(buf, string, offset, length) {
        return blitBuffer(base64ToBytes(string), buf, offset, length);
    }

    function ucs2Write(buf, string, offset, length) {
        return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
    }

    Buffer.prototype.write = function write(string, offset, length, encoding) {
        // Buffer#write(string)
        if (offset === undefined) {
            encoding = "utf8";
            length = this.length;
            offset = 0;
            // Buffer#write(string, encoding)
        } else if (length === undefined && typeof offset === "string") {
            encoding = offset;
            length = this.length;
            offset = 0;
            // Buffer#write(string, offset[, length][, encoding])
        } else if (isFinite(offset)) {
            offset = offset >>> 0;
            if (isFinite(length)) {
                length = length >>> 0;
                if (encoding === undefined) encoding = "utf8";
            } else {
                encoding = length;
                length = undefined;
            }
            // legacy write(string, encoding, offset, length) - remove in v0.13
        } else {
            throw new Error(
                "Buffer.write(string, encoding, offset[, length]) is no longer supported"
            );
        }

        var remaining = this.length - offset;
        if (length === undefined || length > remaining) length = remaining;

        if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
            throw new RangeError("Attempt to write outside buffer bounds");
        }

        if (!encoding) encoding = "utf8";

        var loweredCase = false;
        for (;;) {
            switch (encoding) {
                case "hex":
                    return hexWrite(this, string, offset, length);

                case "utf8":
                case "utf-8":
                    return utf8Write(this, string, offset, length);

                case "ascii":
                    return asciiWrite(this, string, offset, length);

                case "latin1":
                case "binary":
                    return latin1Write(this, string, offset, length);

                case "base64":
                    // Warning: maxLength not taken into account in base64Write
                    return base64Write(this, string, offset, length);

                case "ucs2":
                case "ucs-2":
                case "utf16le":
                case "utf-16le":
                    return ucs2Write(this, string, offset, length);

                default:
                    if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
                    encoding = ("" + encoding).toLowerCase();
                    loweredCase = true;
            }
        }
    };

    Buffer.prototype.toJSON = function toJSON() {
        return {
            type: "Buffer",
            data: Array.prototype.slice.call(this._arr || this, 0),
        };
    };

    function base64Slice(buf, start, end) {
        if (start === 0 && end === buf.length) {
            return base64.fromByteArray(buf);
        } else {
            return base64.fromByteArray(buf.slice(start, end));
        }
    }

    function utf8Slice(buf, start, end) {
        end = Math.min(buf.length, end);
        var res = [];

        var i = start;
        while (i < end) {
            var firstByte = buf[i];
            var codePoint = null;
            var bytesPerSequence = (firstByte > 0xEF) ? 4 :
                (firstByte > 0xDF) ? 3 :
                (firstByte > 0xBF) ? 2 :
                1;

            if (i + bytesPerSequence <= end) {
                var secondByte, thirdByte, fourthByte, tempCodePoint;

                switch (bytesPerSequence) {
                    case 1:
                        if (firstByte < 0x80) {
                            codePoint = firstByte;
                        }
                        break;
                    case 2:
                        secondByte = buf[i + 1];
                        if ((secondByte & 0xC0) === 0x80) {
                            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
                            if (tempCodePoint > 0x7F) {
                                codePoint = tempCodePoint;
                            }
                        }
                        break;
                    case 3:
                        secondByte = buf[i + 1];
                        thirdByte = buf[i + 2];
                        if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
                            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                                codePoint = tempCodePoint;
                            }
                        }
                        break;
                    case 4:
                        secondByte = buf[i + 1];
                        thirdByte = buf[i + 2];
                        fourthByte = buf[i + 3];
                        if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
                            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                                codePoint = tempCodePoint;
                            }
                        }
                }
            }

            if (codePoint === null) {
                // we did not generate a valid codePoint so insert a
                // replacement char (U+FFFD) and advance only 1 byte
                codePoint = 0xFFFD;
                bytesPerSequence = 1;
            } else if (codePoint > 0xFFFF) {
                // encode to utf16 (surrogate pair dance)
                codePoint -= 0x10000;
                res.push(codePoint >>> 10 & 0x3FF | 0xD800);
                codePoint = 0xDC00 | codePoint & 0x3FF;
            }

            res.push(codePoint);
            i += bytesPerSequence;
        }

        return decodeCodePointsArray(res);
    }

    // Based on http://stackoverflow.com/a/22747272/680742, the browser with
    // the lowest limit is Chrome, with 0x10000 args.
    // We go 1 magnitude less, for safety
    var MAX_ARGUMENTS_LENGTH = 0x1000;

    function decodeCodePointsArray(codePoints) {
        var len = codePoints.length;
        if (len <= MAX_ARGUMENTS_LENGTH) {
            return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
        }

        // Decode in chunks to avoid "call stack size exceeded".
        var res = "";
        var i = 0;
        while (i < len) {
            res += String.fromCharCode.apply(
                String,
                codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
            );
        }
        return res;
    }

    function asciiSlice(buf, start, end) {
        var ret = "";
        end = Math.min(buf.length, end);

        for (var i = start; i < end; ++i) {
            ret += String.fromCharCode(buf[i] & 0x7F);
        }
        return ret;
    }

    function latin1Slice(buf, start, end) {
        var ret = "";
        end = Math.min(buf.length, end);

        for (var i = start; i < end; ++i) {
            ret += String.fromCharCode(buf[i]);
        }
        return ret;
    }

    function hexSlice(buf, start, end) {
        var len = buf.length;

        if (!start || start < 0) start = 0;
        if (!end || end < 0 || end > len) end = len;

        var out = "";
        for (var i = start; i < end; ++i) {
            out += toHex(buf[i]);
        }
        return out;
    }

    function utf16leSlice(buf, start, end) {
        var bytes = buf.slice(start, end);
        var res = "";
        for (var i = 0; i < bytes.length; i += 2) {
            res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
        }
        return res;
    }

    Buffer.prototype.slice = function slice(start, end) {
        var len = this.length;
        start = ~~start;
        end = end === undefined ? len : ~~end;

        if (start < 0) {
            start += len;
            if (start < 0) start = 0;
        } else if (start > len) {
            start = len;
        }

        if (end < 0) {
            end += len;
            if (end < 0) end = 0;
        } else if (end > len) {
            end = len;
        }

        if (end < start) end = start;

        var newBuf = this.subarray(start, end);
        // Return an augmented `Uint8Array` instance
        newBuf.__proto__ = Buffer.prototype;
        return newBuf;
    };

    /*
     * Need to make sure that buffer isn't trying to write out of bounds.
     */
    function checkOffset(offset, ext, length) {
        if ((offset % 1) !== 0 || offset < 0) throw new RangeError("offset is not uint");
        if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
    }

    Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
        offset = offset >>> 0;
        byteLength = byteLength >>> 0;
        if (!noAssert) checkOffset(offset, byteLength, this.length);

        var val = this[offset];
        var mul = 1;
        var i = 0;
        while (++i < byteLength && (mul *= 0x100)) {
            val += this[offset + i] * mul;
        }

        return val;
    };

    Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
        offset = offset >>> 0;
        byteLength = byteLength >>> 0;
        if (!noAssert) {
            checkOffset(offset, byteLength, this.length);
        }

        var val = this[offset + --byteLength];
        var mul = 1;
        while (byteLength > 0 && (mul *= 0x100)) {
            val += this[offset + --byteLength] * mul;
        }

        return val;
    };

    Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 1, this.length);
        return this[offset];
    };

    Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        return this[offset] | (this[offset + 1] << 8);
    };

    Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        return (this[offset] << 8) | this[offset + 1];
    };

    Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);

        return ((this[offset]) |
                (this[offset + 1] << 8) |
                (this[offset + 2] << 16)) +
            (this[offset + 3] * 0x1000000);
    };

    Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);

        return (this[offset] * 0x1000000) +
            ((this[offset + 1] << 16) |
                (this[offset + 2] << 8) |
                this[offset + 3]);
    };

    Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
        offset = offset >>> 0;
        byteLength = byteLength >>> 0;
        if (!noAssert) checkOffset(offset, byteLength, this.length);

        var val = this[offset];
        var mul = 1;
        var i = 0;
        while (++i < byteLength && (mul *= 0x100)) {
            val += this[offset + i] * mul;
        }
        mul *= 0x80;

        if (val >= mul) val -= Math.pow(2, 8 * byteLength);

        return val;
    };

    Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
        offset = offset >>> 0;
        byteLength = byteLength >>> 0;
        if (!noAssert) checkOffset(offset, byteLength, this.length);

        var i = byteLength;
        var mul = 1;
        var val = this[offset + --i];
        while (i > 0 && (mul *= 0x100)) {
            val += this[offset + --i] * mul;
        }
        mul *= 0x80;

        if (val >= mul) val -= Math.pow(2, 8 * byteLength);

        return val;
    };

    Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 1, this.length);
        if (!(this[offset] & 0x80)) return (this[offset]);
        return ((0xff - this[offset] + 1) * -1);
    };

    Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        var val = this[offset] | (this[offset + 1] << 8);
        return (val & 0x8000) ? val | 0xFFFF0000 : val;
    };

    Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 2, this.length);
        var val = this[offset + 1] | (this[offset] << 8);
        return (val & 0x8000) ? val | 0xFFFF0000 : val;
    };

    Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);

        return (this[offset]) |
            (this[offset + 1] << 8) |
            (this[offset + 2] << 16) |
            (this[offset + 3] << 24);
    };

    Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);

        return (this[offset] << 24) |
            (this[offset + 1] << 16) |
            (this[offset + 2] << 8) |
            (this[offset + 3]);
    };

    Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return ieee754.read(this, offset, true, 23, 4);
    };

    Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 4, this.length);
        return ieee754.read(this, offset, false, 23, 4);
    };

    Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 8, this.length);
        return ieee754.read(this, offset, true, 52, 8);
    };

    Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
        offset = offset >>> 0;
        if (!noAssert) checkOffset(offset, 8, this.length);
        return ieee754.read(this, offset, false, 52, 8);
    };

    function checkInt(buf, value, offset, ext, max, min) {
        if (!Buffer.isBuffer(buf)) throw new TypeError("\"buffer\" argument must be a Buffer instance");
        if (value > max || value < min) throw new RangeError("\"value\" argument is out of bounds");
        if (offset + ext > buf.length) throw new RangeError("Index out of range");
    }

    Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
        value = +value;
        offset = offset >>> 0;
        byteLength = byteLength >>> 0;
        if (!noAssert) {
            var maxBytes = Math.pow(2, 8 * byteLength) - 1;
            checkInt(this, value, offset, byteLength, maxBytes, 0);
        }

        var mul = 1;
        var i = 0;
        this[offset] = value & 0xFF;
        while (++i < byteLength && (mul *= 0x100)) {
            this[offset + i] = (value / mul) & 0xFF;
        }

        return offset + byteLength;
    };

    Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
        value = +value;
        offset = offset >>> 0;
        byteLength = byteLength >>> 0;
        if (!noAssert) {
            var maxBytes = Math.pow(2, 8 * byteLength) - 1;
            checkInt(this, value, offset, byteLength, maxBytes, 0);
        }

        var i = byteLength - 1;
        var mul = 1;
        this[offset + i] = value & 0xFF;
        while (--i >= 0 && (mul *= 0x100)) {
            this[offset + i] = (value / mul) & 0xFF;
        }

        return offset + byteLength;
    };

    Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
        this[offset] = (value & 0xff);
        return offset + 1;
    };

    Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
        this[offset] = (value & 0xff);
        this[offset + 1] = (value >>> 8);
        return offset + 2;
    };

    Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
        this[offset] = (value >>> 8);
        this[offset + 1] = (value & 0xff);
        return offset + 2;
    };

    Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
        this[offset + 3] = (value >>> 24);
        this[offset + 2] = (value >>> 16);
        this[offset + 1] = (value >>> 8);
        this[offset] = (value & 0xff);
        return offset + 4;
    };

    Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
        this[offset] = (value >>> 24);
        this[offset + 1] = (value >>> 16);
        this[offset + 2] = (value >>> 8);
        this[offset + 3] = (value & 0xff);
        return offset + 4;
    };

    Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
            var limit = Math.pow(2, 8 * byteLength - 1);

            checkInt(this, value, offset, byteLength, limit - 1, -limit);
        }

        var i = 0;
        var mul = 1;
        var sub = 0;
        this[offset] = value & 0xFF;
        while (++i < byteLength && (mul *= 0x100)) {
            if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
                sub = 1;
            }
            this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
        }

        return offset + byteLength;
    };

    Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
            var limit = Math.pow(2, 8 * byteLength - 1);

            checkInt(this, value, offset, byteLength, limit - 1, -limit);
        }

        var i = byteLength - 1;
        var mul = 1;
        var sub = 0;
        this[offset + i] = value & 0xFF;
        while (--i >= 0 && (mul *= 0x100)) {
            if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
                sub = 1;
            }
            this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
        }

        return offset + byteLength;
    };

    Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
        if (value < 0) value = 0xff + value + 1;
        this[offset] = (value & 0xff);
        return offset + 1;
    };

    Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
        this[offset] = (value & 0xff);
        this[offset + 1] = (value >>> 8);
        return offset + 2;
    };

    Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
        this[offset] = (value >>> 8);
        this[offset + 1] = (value & 0xff);
        return offset + 2;
    };

    Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
        this[offset] = (value & 0xff);
        this[offset + 1] = (value >>> 8);
        this[offset + 2] = (value >>> 16);
        this[offset + 3] = (value >>> 24);
        return offset + 4;
    };

    Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
        if (value < 0) value = 0xffffffff + value + 1;
        this[offset] = (value >>> 24);
        this[offset + 1] = (value >>> 16);
        this[offset + 2] = (value >>> 8);
        this[offset + 3] = (value & 0xff);
        return offset + 4;
    };

    function checkIEEE754(buf, value, offset, ext, max, min) {
        if (offset + ext > buf.length) throw new RangeError("Index out of range");
        if (offset < 0) throw new RangeError("Index out of range");
    }

    function writeFloat(buf, value, offset, littleEndian, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
            checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
        }
        ieee754.write(buf, value, offset, littleEndian, 23, 4);
        return offset + 4;
    }

    Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
        return writeFloat(this, value, offset, true, noAssert);
    };

    Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
        return writeFloat(this, value, offset, false, noAssert);
    };

    function writeDouble(buf, value, offset, littleEndian, noAssert) {
        value = +value;
        offset = offset >>> 0;
        if (!noAssert) {
            checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
        }
        ieee754.write(buf, value, offset, littleEndian, 52, 8);
        return offset + 8;
    }

    Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
        return writeDouble(this, value, offset, true, noAssert);
    };

    Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
        return writeDouble(this, value, offset, false, noAssert);
    };

    // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
    Buffer.prototype.copy = function copy(target, targetStart, start, end) {
        if (!start) start = 0;
        if (!end && end !== 0) end = this.length;
        if (targetStart >= target.length) targetStart = target.length;
        if (!targetStart) targetStart = 0;
        if (end > 0 && end < start) end = start;

        // Copy 0 bytes; we're done
        if (end === start) return 0;
        if (target.length === 0 || this.length === 0) return 0;

        // Fatal error conditions
        if (targetStart < 0) {
            throw new RangeError("targetStart out of bounds");
        }
        if (start < 0 || start >= this.length) throw new RangeError("sourceStart out of bounds");
        if (end < 0) throw new RangeError("sourceEnd out of bounds");

        // Are we oob?
        if (end > this.length) end = this.length;
        if (target.length - targetStart < end - start) {
            end = target.length - targetStart + start;
        }

        var len = end - start;
        var i;

        if (this === target && start < targetStart && targetStart < end) {
            // descending copy from end
            for (i = len - 1; i >= 0; --i) {
                target[i + targetStart] = this[i + start];
            }
        } else if (len < 1000) {
            // ascending copy from start
            for (i = 0; i < len; ++i) {
                target[i + targetStart] = this[i + start];
            }
        } else {
            Uint8Array.prototype.set.call(
                target,
                this.subarray(start, start + len),
                targetStart
            );
        }

        return len;
    };

    // Usage:
    //    buffer.fill(number[, offset[, end]])
    //    buffer.fill(buffer[, offset[, end]])
    //    buffer.fill(string[, offset[, end]][, encoding])
    Buffer.prototype.fill = function fill(val, start, end, encoding) {
        // Handle string cases:
        if (typeof val === "string") {
            if (typeof start === "string") {
                encoding = start;
                start = 0;
                end = this.length;
            } else if (typeof end === "string") {
                encoding = end;
                end = this.length;
            }
            if (val.length === 1) {
                var code = val.charCodeAt(0);
                if (code < 256) {
                    val = code;
                }
            }
            if (encoding !== undefined && typeof encoding !== "string") {
                throw new TypeError("encoding must be a string");
            }
            if (typeof encoding === "string" && !Buffer.isEncoding(encoding)) {
                throw new TypeError("Unknown encoding: " + encoding);
            }
        } else if (typeof val === "number") {
            val = val & 255;
        }

        // Invalid ranges are not set to a default, so can range check early.
        if (start < 0 || this.length < start || this.length < end) {
            throw new RangeError("Out of range index");
        }

        if (end <= start) {
            return this;
        }

        start = start >>> 0;
        end = end === undefined ? this.length : end >>> 0;

        if (!val) val = 0;

        var i;
        if (typeof val === "number") {
            for (i = start; i < end; ++i) {
                this[i] = val;
            }
        } else {
            var bytes = Buffer.isBuffer(val) ?
                val :
                new Buffer(val, encoding);
            var len = bytes.length;
            for (i = 0; i < end - start; ++i) {
                this[i + start] = bytes[i % len];
            }
        }

        return this;
    };

    // HELPER FUNCTIONS
    // ================

    var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;

    function base64clean(str) {
        // Node strips out invalid characters like \n and \t from the string, base64-js does not
        str = stringtrim(str).replace(INVALID_BASE64_RE, "");
        // Node converts strings with length < 2 to ''
        if (str.length < 2) return "";
        // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
        while (str.length % 4 !== 0) {
            str = str + "=";
        }
        return str;
    }

    function stringtrim(str) {
        if (str.trim) return str.trim();
        return str.replace(/^\s+|\s+$/g, "");
    }

    function toHex(n) {
        if (n < 16) return "0" + n.toString(16);
        return n.toString(16);
    }

    function utf8ToBytes(string, units) {
        units = units || Infinity;
        var codePoint;
        var length = string.length;
        var leadSurrogate = null;
        var bytes = [];

        for (var i = 0; i < length; ++i) {
            codePoint = string.charCodeAt(i);

            // is surrogate component
            if (codePoint > 0xD7FF && codePoint < 0xE000) {
                // last char was a lead
                if (!leadSurrogate) {
                    // no lead yet
                    if (codePoint > 0xDBFF) {
                        // unexpected trail
                        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                        continue;
                    } else if (i + 1 === length) {
                        // unpaired lead
                        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                        continue;
                    }

                    // valid lead
                    leadSurrogate = codePoint;

                    continue;
                }

                // 2 leads in a row
                if (codePoint < 0xDC00) {
                    if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
                    leadSurrogate = codePoint;
                    continue;
                }

                // valid surrogate pair
                codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
            } else if (leadSurrogate) {
                // valid bmp char, but last char was a lead
                if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            }

            leadSurrogate = null;

            // encode utf8
            if (codePoint < 0x80) {
                if ((units -= 1) < 0) break;
                bytes.push(codePoint);
            } else if (codePoint < 0x800) {
                if ((units -= 2) < 0) break;
                bytes.push(
                    codePoint >> 0x6 | 0xC0,
                    codePoint & 0x3F | 0x80
                );
            } else if (codePoint < 0x10000) {
                if ((units -= 3) < 0) break;
                bytes.push(
                    codePoint >> 0xC | 0xE0,
                    codePoint >> 0x6 & 0x3F | 0x80,
                    codePoint & 0x3F | 0x80
                );
            } else if (codePoint < 0x110000) {
                if ((units -= 4) < 0) break;
                bytes.push(
                    codePoint >> 0x12 | 0xF0,
                    codePoint >> 0xC & 0x3F | 0x80,
                    codePoint >> 0x6 & 0x3F | 0x80,
                    codePoint & 0x3F | 0x80
                );
            } else {
                throw new Error("Invalid code point");
            }
        }

        return bytes;
    }

    function asciiToBytes(str) {
        var byteArray = [];
        for (var i = 0; i < str.length; ++i) {
            // Node's code seems to be doing this and not & 0x7F..
            byteArray.push(str.charCodeAt(i) & 0xFF);
        }
        return byteArray;
    }

    function utf16leToBytes(str, units) {
        var c, hi, lo;
        var byteArray = [];
        for (var i = 0; i < str.length; ++i) {
            if ((units -= 2) < 0) break;

            c = str.charCodeAt(i);
            hi = c >> 8;
            lo = c % 256;
            byteArray.push(lo);
            byteArray.push(hi);
        }

        return byteArray;
    }

    function base64ToBytes(str) {
        return base64.toByteArray(base64clean(str));
    }

    function blitBuffer(src, dst, offset, length) {
        for (var i = 0; i < length; ++i) {
            if ((i + offset >= dst.length) || (i >= src.length)) break;
            dst[i + offset] = src[i];
        }
        return i;
    }

    function isnan(val) {
        return val !== val; // eslint-disable-line no-self-compare
    }
}
});
return ___scope___.entry = "index.js";
});
FuseBox.pkg("base64-js", {}, function(___scope___){
___scope___.file("index.js", function(exports, require, module, __filename, __dirname){

'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return (b64.length * 3 / 4) - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr((len * 3 / 4) - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0; i < l; i += 4) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

});
return ___scope___.entry = "index.js";
});
FuseBox.pkg("ieee754", {}, function(___scope___){
___scope___.file("index.js", function(exports, require, module, __filename, __dirname){

exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

});
return ___scope___.entry = "index.js";
});
FuseBox.target = "universal"
})
((function(__root__){
if (__root__["FuseBox"]) return __root__["FuseBox"];
var $isBrowser = typeof window !== "undefined" && window.navigator;
var g = $isBrowser ? window : global;
if ($isBrowser) {
    g["global"] = window;
}
__root__ = !$isBrowser || typeof __fbx__dnm__ !== "undefined" ? module.exports : __root__;
var $fsbx = $isBrowser ? (window["__fsbx__"] = window["__fsbx__"] || {})
    : g["$fsbx"] = g["$fsbx"] || {};
if (!$isBrowser) {
    g["require"] = require;
}
var $packages = $fsbx.p = $fsbx.p || {};
var $events = $fsbx.e = $fsbx.e || {};
function $getNodeModuleName(name) {
    var n = name.charCodeAt(0);
    var s = name.charCodeAt(1);
    if (!$isBrowser && s === 58) {
        return;
    }
    if (n >= 97 && n <= 122 || n === 64) {
        if (n === 64) {
            var s_1 = name.split("/");
            var target = s_1.splice(2, s_1.length).join("/");
            return [s_1[0] + "/" + s_1[1], target || undefined];
        }
        var index = name.indexOf("/");
        if (index === -1) {
            return [name];
        }
        var first = name.substring(0, index);
        var second = name.substring(index + 1);
        return [first, second];
    }
}
;
function $getDir(filePath) {
    return filePath.substring(0, filePath.lastIndexOf("/")) || "./";
}
;
function $pathJoin() {
    var string = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        string[_i] = arguments[_i];
    }
    var parts = [];
    for (var i = 0, l = arguments.length; i < l; i++) {
        parts = parts.concat(arguments[i].split("/"));
    }
    var newParts = [];
    for (var i = 0, l = parts.length; i < l; i++) {
        var part = parts[i];
        if (!part || part === ".")
            continue;
        if (part === "..") {
            newParts.pop();
        }
        else {
            newParts.push(part);
        }
    }
    if (parts[0] === "")
        newParts.unshift("");
    return newParts.join("/") || (newParts.length ? "/" : ".");
}
;
function $ensureExtension(name) {
    var matched = name.match(/\.(\w{1,})$/);
    if (matched) {
        if (!matched[1]) {
            return name + ".js";
        }
        return name;
    }
    return name + ".js";
}
;
function $loadURL(url) {
    if ($isBrowser) {
        var d = document;
        var head = d.getElementsByTagName("head")[0];
        var target;
        if (/\.css$/.test(url)) {
            target = d.createElement("link");
            target.rel = "stylesheet";
            target.type = "text/css";
            target.href = url;
        }
        else {
            target = d.createElement("script");
            target.type = "text/javascript";
            target.src = url;
            target.async = true;
        }
        head.insertBefore(target, head.firstChild);
    }
}
;
function $loopObjKey(obj, func) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            func(key, obj[key]);
        }
    }
}
;
function $serverRequire(path) {
    return { server: require(path) };
}
;
function $getRef(name, o) {
    var basePath = o.path || "./";
    var pkgName = o.pkg || "default";
    var nodeModule = $getNodeModuleName(name);
    if (nodeModule) {
        basePath = "./";
        pkgName = nodeModule[0];
        if (o.v && o.v[pkgName]) {
            pkgName = pkgName + "@" + o.v[pkgName];
        }
        name = nodeModule[1];
    }
    if (name) {
        if (name.charCodeAt(0) === 126) {
            name = name.slice(2, name.length);
            basePath = "./";
        }
        else {
            if (!$isBrowser && (name.charCodeAt(0) === 47 || name.charCodeAt(1) === 58)) {
                return $serverRequire(name);
            }
        }
    }
    var pkg = $packages[pkgName];
    if (!pkg) {
        if ($isBrowser && FuseBox.target !== "electron") {
            throw "Package not found " + pkgName;
        }
        else {
            return $serverRequire(pkgName + (name ? "/" + name : ""));
        }
    }
    name = name ? name : "./" + pkg.s.entry;
    var filePath = $pathJoin(basePath, name);
    var validPath = $ensureExtension(filePath);
    var file = pkg.f[validPath];
    var wildcard;
    if (!file && validPath.indexOf("*") > -1) {
        wildcard = validPath;
    }
    if (!file && !wildcard) {
        validPath = $pathJoin(filePath, "/", "index.js");
        file = pkg.f[validPath];
        if (!file) {
            validPath = filePath + ".js";
            file = pkg.f[validPath];
        }
        if (!file) {
            file = pkg.f[filePath + ".jsx"];
        }
        if (!file) {
            validPath = filePath + "/index.jsx";
            file = pkg.f[validPath];
        }
    }
    return {
        file: file,
        wildcard: wildcard,
        pkgName: pkgName,
        versions: pkg.v,
        filePath: filePath,
        validPath: validPath,
    };
}
;
function $async(file, cb, o) {
    if (o === void 0) { o = {}; }
    if ($isBrowser) {
        if (o && o.ajaxed === file) {
            return console.error(file, 'does not provide a module');
        }
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status == 200) {
                    var contentType = xmlhttp.getResponseHeader("Content-Type");
                    var content = xmlhttp.responseText;
                    if (/json/.test(contentType)) {
                        content = "module.exports = " + content;
                    }
                    else {
                        if (!/javascript/.test(contentType)) {
                            content = "module.exports = " + JSON.stringify(content);
                        }
                    }
                    var normalized = $pathJoin("./", file);
                    FuseBox.dynamic(normalized, content);
                    cb(FuseBox.import(file, { ajaxed: file }));
                }
                else {
                    console.error(file, 'not found on request');
                    cb(undefined);
                }
            }
        };
        xmlhttp.open("GET", file, true);
        xmlhttp.send();
    }
    else {
        if (/\.(js|json)$/.test(file))
            return cb(g["require"](file));
        return cb("");
    }
}
;
function $trigger(name, args) {
    var e = $events[name];
    if (e) {
        for (var i in e) {
            var res = e[i].apply(null, args);
            if (res === false) {
                return false;
            }
        }
        ;
    }
}
;
function $import(name, o) {
    if (o === void 0) { o = {}; }
    if (name.charCodeAt(4) === 58 || name.charCodeAt(5) === 58) {
        return $loadURL(name);
    }
    var ref = $getRef(name, o);
    if (ref.server) {
        return ref.server;
    }
    var file = ref.file;
    if (ref.wildcard) {
        var safeRegEx = new RegExp(ref.wildcard
            .replace(/\*/g, "@")
            .replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&")
            .replace(/@@/g, ".*")
            .replace(/@/g, "[a-z0-9$_-]+"), "i");
        var pkg_1 = $packages[ref.pkgName];
        if (pkg_1) {
            var batch = {};
            for (var n in pkg_1.f) {
                if (safeRegEx.test(n)) {
                    batch[n] = $import(ref.pkgName + "/" + n);
                }
            }
            return batch;
        }
    }
    if (!file) {
        var asyncMode_1 = typeof o === "function";
        var processStopped = $trigger("async", [name, o]);
        if (processStopped === false) {
            return;
        }
        return $async(name, function (result) { return asyncMode_1 ? o(result) : null; }, o);
    }
    var pkg = ref.pkgName;
    if (file.locals && file.locals.module)
        return file.locals.module.exports;
    var locals = file.locals = {};
    var path = $getDir(ref.validPath);
    locals.exports = {};
    locals.module = { exports: locals.exports };
    locals.require = function (name, optionalCallback) {
        return $import(name, {
            pkg: pkg,
            path: path,
            v: ref.versions,
        });
    };
    if ($isBrowser || !g["require"].main) {
        locals.require.main = { filename: "./", paths: [] };
    }
    else {
        locals.require.main = g["require"].main;
    }
    var args = [locals.module.exports, locals.require, locals.module, ref.validPath, path, pkg];
    $trigger("before-import", args);
    file.fn.apply(0, args);
    $trigger("after-import", args);
    return locals.module.exports;
}
;
var FuseBox = (function () {
    function FuseBox() {
    }
    FuseBox.global = function (key, obj) {
        if (obj === undefined)
            return g[key];
        g[key] = obj;
    };
    FuseBox.import = function (name, o) {
        return $import(name, o);
    };
    FuseBox.on = function (n, fn) {
        $events[n] = $events[n] || [];
        $events[n].push(fn);
    };
    FuseBox.exists = function (path) {
        try {
            var ref = $getRef(path, {});
            return ref.file !== undefined;
        }
        catch (err) {
            return false;
        }
    };
    FuseBox.remove = function (path) {
        var ref = $getRef(path, {});
        var pkg = $packages[ref.pkgName];
        if (pkg && pkg.f[ref.validPath]) {
            delete pkg.f[ref.validPath];
        }
    };
    FuseBox.main = function (name) {
        this.mainFile = name;
        return FuseBox.import(name, {});
    };
    FuseBox.expose = function (obj) {
        var _loop_1 = function (k) {
            var alias = obj[k].alias;
            var xp = $import(obj[k].pkg);
            if (alias === "*") {
                $loopObjKey(xp, function (exportKey, value) { return __root__[exportKey] = value; });
            }
            else if (typeof alias === "object") {
                $loopObjKey(alias, function (exportKey, value) { return __root__[value] = xp[exportKey]; });
            }
            else {
                __root__[alias] = xp;
            }
        };
        for (var k in obj) {
            _loop_1(k);
        }
    };
    FuseBox.dynamic = function (path, str, opts) {
        this.pkg(opts && opts.pkg || "default", {}, function (___scope___) {
            ___scope___.file(path, function (exports, require, module, __filename, __dirname) {
                var res = new Function("__fbx__dnm__", "exports", "require", "module", "__filename", "__dirname", "__root__", str);
                res(true, exports, require, module, __filename, __dirname, __root__);
            });
        });
    };
    FuseBox.flush = function (shouldFlush) {
        var def = $packages["default"];
        for (var fileName in def.f) {
            if (!shouldFlush || shouldFlush(fileName)) {
                delete def.f[fileName].locals;
            }
        }
    };
    FuseBox.pkg = function (name, v, fn) {
        if ($packages[name])
            return fn($packages[name].s);
        var pkg = $packages[name] = {};
        pkg.f = {};
        pkg.v = v;
        pkg.s = {
            file: function (name, fn) { return pkg.f[name] = { fn: fn }; },
        };
        return fn(pkg.s);
    };
    FuseBox.addPlugin = function (plugin) {
        this.plugins.push(plugin);
    };
    FuseBox.packages = $packages;
    FuseBox.isBrowser = $isBrowser;
    FuseBox.isServer = !$isBrowser;
    FuseBox.plugins = [];
    return FuseBox;
}());
if (!$isBrowser) {
    g["FuseBox"] = FuseBox;
}

return __root__["FuseBox"] = FuseBox; } )(this))
//# sourceMappingURL=vendor.js.map