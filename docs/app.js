(function(FuseBox){FuseBox.$fuse$=FuseBox;
var __process_env__ = {"isProduction":false};
FuseBox.pkg("default", {}, function(___scope___){
___scope___.file("index.js", function(exports, require, module, __filename, __dirname){
/* fuse:injection: */ var process = require("process");
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./assets/icons-bundle.css");
require("./styles.css");
const module_1 = require("./module");
const root = require("./Root");
require("./hmr");
navigator.serviceWorker.register('service-worker.js');
let DEV = !process.env.isProduction;
(async () => {
    let app = await module_1.runModule(root, DEV);
    window.app = app;
    app.moduleAPI.dispatch(['Root', 'init']);
})();
//# sourceMappingURL=index.js.map
});
___scope___.file("styles.css", function(exports, require, module, __filename, __dirname){


require("fuse-box-css")("styles.css", "/* Global styles */\n\nhtml, body {\n  box-sizing: border-box;\n  margin: 0px;\n  width: 100%;\n  height: 100%;\n}\n#app {\n  width: 100%;\n  height: 100%;\n}\n*, *:before, *:after {\n  box-sizing: inherit;\n}\n\n/* App styles (fonts and other globals) */\n")
});
___scope___.file("module.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fractal_core_1 = require("fractal-core");
const view_1 = require("fractal-core/interfaces/view");
const style_1 = require("fractal-core/groups/style");
exports.runModule = (root, DEV, viewCb) => fractal_core_1.run(Object.assign({ root, groups: {
        style: style_1.styleHandler('', DEV),
    }, interfaces: {
        view: view_1.viewHandler('#app', viewCb),
    } }, DEV ? fractal_core_1.logFns : {}));

});
___scope___.file("Root/index.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fractal_core_1 = require("fractal-core");
const view_1 = require("fractal-core/interfaces/view");
const utils_1 = require("../utils");
const constants_1 = require("./constants");
const slides_1 = require("./slides");
const numSlides = Object.keys(slides_1.default).length;
exports.name = 'Root';
exports.components = slides_1.default;
exports.state = {
    step: 'visible',
    slide: 0,
    animated: false,
    fullscreen: false,
};
exports.inputs = ({ toAct, stateOf, toIt, toChild }) => ({
    init: async () => {
        let hash = window.location.hash || '#0';
        if (hash) {
            let slide = parseInt(hash.substr(1));
            toAct('SetSlide', slide);
            toChild(slide + '', 'init');
        }
        window.addEventListener('hashchange', () => {
            let slide = parseInt((window.location.hash || '#0').substr(1));
            toAct('SetSlide', slide);
            setTimeout(() => toChild(slide + '', 'init'), 500);
        });
        window.addEventListener('keyup', ev => {
            if (utils_1.isDecendantOfId(ev.target, 'codeEditor') || utils_1.isDecendantOfId(ev.target, 'testEditor')) {
                return;
            }
            if (ev.keyCode === 39) {
                toIt('slide', 'NextSlide');
            }
            else if (ev.keyCode === 37) {
                toIt('slide', 'PrevSlide');
            }
        });
    },
    slide: async (action) => {
        await toAct('SetAnimated', true);
        await toAct('SetStep', action === 'NextSlide' ? 'hiddenLeft' : 'hiddenRight');
        await utils_1.waitMS(300);
        let initialSlide = stateOf().slide;
        await toAct(action);
        let slide = stateOf().slide;
        if (slide === initialSlide) {
            await toAct('SetStep', 'visible');
            return;
        }
        await toIt('setHash', slide);
        await toAct('SetAnimated', false);
        await toAct('SetStep', action === 'NextSlide' ? 'hiddenRight' : 'hiddenLeft');
        await utils_1.waitMS(100);
        await toAct('SetAnimated', true);
        await toChild(slide + '', 'init');
        await toAct('SetStep', 'visible');
    },
    setHash: (hash) => {
        history.pushState(null, null, document.location.pathname + '#' + hash);
    },
    toggleFullScreen: async () => {
        if (stateOf().fullscreen) {
            utils_1.exitFullscreen();
        }
        else {
            utils_1.launchIntoFullscreen(document.documentElement);
        }
        await toAct('ToggleFullscreen');
    },
});
exports.actions = {
    ToggleFullscreen: () => s => {
        s.fullscreen = !s.fullscreen;
        return s;
    },
    SetStep: fractal_core_1.assoc('step'),
    SetSlide: fractal_core_1.assoc('slide'),
    SetAnimated: fractal_core_1.assoc('animated'),
    NextSlide: () => s => {
        if (s.slide < numSlides - 1) {
            s.slide++;
        }
        return s;
    },
    PrevSlide: () => s => {
        if (s.slide > 0) {
            s.slide--;
        }
        return s;
    },
};
const view = ({ ctx, ev, vw, act }) => s => {
    let style = ctx.groups.style;
    return view_1.h('div', {
        key: ctx.name,
        class: { [style.base]: true },
    }, [
        view_1.h('div', { class: {
                [style.slide]: true,
                [style.slideVisible]: s.step === 'visible',
                [style.slideAnimated]: s.animated,
                [style.slideHiddenLeft]: s.step === 'hiddenLeft',
                [style.slideHiddenRight]: s.step === 'hiddenRight',
            } }, [
            view_1.h('div', { class: { [style.buttonContainer]: true } }, [
                view_1.h('button', {
                    class: { [style.button]: true, [style.buttonDisabled]: s.slide === 0 },
                    on: { click: ev('slide', 'PrevSlide') },
                    attrs: s.slide === 0 ? { disabled: 'disabled' } : {},
                }, '<'),
                view_1.h('button', {
                    class: { [style.button]: true },
                    on: { click: ev('toggleFullScreen') },
                }, s.fullscreen ? 'X' : 'O'),
                view_1.h('button', {
                    class: { [style.button]: true, [style.buttonDisabled]: s.slide === numSlides - 1 },
                    on: { click: ev('slide', 'NextSlide') },
                    attrs: s.slide === numSlides - 1 ? { disabled: 'disabled' } : {},
                }, '>'),
            ]),
            vw(s.slide + ''),
        ]),
    ]);
};
exports.interfaces = { view };
const style = {
    base: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        fontFamily: '"Open Sans", sans-serif',
        color: constants_1.palette.textPrimary,
        overflow: 'hidden',
    },
    slide: {
        width: '800px',
        height: '92%',
        borderRadius: '40px',
        backgroundColor: 'white',
        opacity: 0,
        boxShadow: '1px 1px 2px 1px #656565',
    },
    slideVisible: {
        opacity: 1,
        transform: 'translateX(0px)',
    },
    slideAnimated: {
        transition: 'transform .4s, opacity .4s',
    },
    slideHiddenLeft: {
        opacity: 0,
        transform: 'translateX(-200px)',
    },
    slideHiddenRight: {
        opacity: 0,
        transform: 'translateX(200px)',
    },
    buttonContainer: {
        position: 'absolute',
        right: '25px',
        bottom: '12px',
    },
    button: {
        margin: '2px',
        width: '30px',
        height: '30px',
        borderRadius: '7px',
        cursor: 'pointer',
        outline: 'none',
        border: 'none',
        fontSize: '20px',
        color: constants_1.palette.textSecondary,
        backgroundColor: 'white',
        $nest: {
            '&:hover': {
                backgroundColor: constants_1.palette.greyLight,
            },
        },
    },
    buttonDisabled: {
        color: constants_1.palette.grey,
        cursor: 'not-allowed',
    },
};
exports.groups = { style };
//# sourceMappingURL=index.js.map
});
___scope___.file("utils.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function waitMS(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}
exports.waitMS = waitMS;
function launchIntoFullscreen(element) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    }
    else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    }
    else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    }
    else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}
exports.launchIntoFullscreen = launchIntoFullscreen;
function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    }
    else if (document.mozCancelFullScreen) {
        ;
        document.mozCancelFullScreen();
    }
    else if (document.webkitExitFullscreen) {
        ;
        document.webkitExitFullscreen();
    }
}
exports.exitFullscreen = exitFullscreen;
function isDecendantOfId(el, id) {
    let x = el;
    while (x = x.parentElement) {
        if (x.id === id) {
            return true;
        }
    }
    return false;
}
exports.isDecendantOfId = isDecendantOfId;
//# sourceMappingURL=utils.js.map
});
___scope___.file("Root/constants.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.palette = {
    primary: '#a332c2',
    secondary: '#ca7947',
    tertiary: '#3271c2',
    quaternary: '#c2b132',
    grey: '#6A6A69',
    greyLight: '#DEDEDE',
    textPrimary: '#363634',
    textSecondary: '#4F4F4D',
};
//# sourceMappingURL=constants.js.map
});
___scope___.file("Root/slides/index.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _0 = require("./0");
const _1 = require("./1");
const _2 = require("./2");
const _3 = require("./3");
const _4 = require("./4");
const _5 = require("./5");
const _6 = require("./6");
const _7 = require("./7");
const _8 = require("./8");
const _9 = require("./9");
const _10 = require("./10");
const _11 = require("./11");
const _12 = require("./12");
exports.default = {
    0: _0,
    1: _1,
    2: _2,
    3: _3,
    4: _4,
    5: _5,
    6: _6,
    7: _7,
    8: _8,
    9: _9,
    10: _10,
    11: _11,
    12: _12,
};
//# sourceMappingURL=index.js.map
});
___scope___.file("Root/slides/0.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const view_1 = require("fractal-core/interfaces/view");
const constants_1 = require("../constants");
exports.name = '0';
exports.state = {};
exports.inputs = ctx => ({});
exports.actions = {};
const view = ({ ctx }) => s => {
    let style = ctx.groups.style;
    return view_1.h('div', {
        key: ctx.name,
        class: { [style.base]: true },
    }, [
        view_1.h('div', { class: { [style.titlePrimary]: true } }, 'La Web es el futuro'),
        view_1.h('div', { class: { [style.titleSecondary]: true } }, '¿Las aplicaciones nativas están condenadas?'),
    ]);
};
exports.interfaces = { view };
const style = {
    base: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titlePrimary: {
        marginBottom: '30px',
        fontSize: '70px',
        textAlign: 'center',
        color: constants_1.palette.primary,
    },
    titleSecondary: {
        paddingBottom: '40px',
        fontSize: '50px',
        textAlign: 'center',
    },
};
exports.groups = { style };
//# sourceMappingURL=0.js.map
});
___scope___.file("Root/slides/1.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const view_1 = require("fractal-core/interfaces/view");
const constants_1 = require("../constants");
exports.name = '1';
exports.state = {};
exports.inputs = ctx => ({});
exports.actions = {};
const view = ({ ctx }) => s => {
    let style = ctx.groups.style;
    return view_1.h('div', {
        key: ctx.name,
        class: { [style.base]: true },
    }, [
        view_1.h('div', { class: { [style.titlePrimary]: true } }, '¿Que es la web?'),
        view_1.h('div', { class: { [style.titleSecondary]: true } }, '- Aplicación que corre sobre internet'),
        view_1.h('div', { class: { [style.titleSecondary]: true } }, '- Plataforma para aplicaciones que corren sobre internet'),
    ]);
};
exports.interfaces = { view };
const style = {
    base: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titlePrimary: {
        marginBottom: '50px',
        fontSize: '70px',
        textAlign: 'center',
        color: constants_1.palette.tertiary,
    },
    titleSecondary: {
        margin: '10px',
        fontSize: '34px',
        textAlign: 'center',
    },
};
exports.groups = { style };
//# sourceMappingURL=1.js.map
});
___scope___.file("Root/slides/2.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const view_1 = require("fractal-core/interfaces/view");
const constants_1 = require("../constants");
exports.name = '2';
exports.state = {};
exports.inputs = ctx => ({});
exports.actions = {};
const view = ({ ctx }) => s => {
    let style = ctx.groups.style;
    return view_1.h('div', {
        key: ctx.name,
        class: { [style.base]: true },
    }, [
        view_1.h('div', { class: { [style.titlePrimary]: true } }, 'La Web es fascinante!'),
        view_1.h('div', { class: { [style.titleSecondary]: true } }, 'Abierta / Multiplataforma / Potente'),
    ]);
};
exports.interfaces = { view };
const style = {
    base: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titlePrimary: {
        padding: '0 20px',
        marginBottom: '50px',
        fontSize: '70px',
        textAlign: 'center',
        color: constants_1.palette.tertiary,
    },
    titleSecondary: {
        margin: '10px',
        fontSize: '34px',
        textAlign: 'center',
    },
};
exports.groups = { style };
//# sourceMappingURL=2.js.map
});
___scope___.file("Root/slides/3.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const view_1 = require("fractal-core/interfaces/view");
const constants_1 = require("../constants");
exports.name = '2';
exports.state = {};
exports.inputs = ctx => ({});
exports.actions = {};
const view = ({ ctx }) => s => {
    let style = ctx.groups.style;
    return view_1.h('div', {
        key: ctx.name,
        class: { [style.base]: true },
    }, [
        view_1.h('div', { class: { [style.titlePrimary]: true } }, 'El poder de la Web y las PWAs'),
        view_1.h('ul', { class: { [style.list]: true } }, [
            view_1.h('li', {
                class: { [style.item]: true },
            }, 'Interacción instantánea (No requiere instalación) - Android libero InstantApps'),
            view_1.h('li', {
                class: { [style.item]: true },
            }, [
                'Trabajo offline via Service Worker API: cache, background-sync … etc, ',
                view_1.h('a', { attrs: {
                        href: 'https://jakearchibald.com/2014/offline-cookbook/',
                        target: '_blank',
                        rel: 'noopener noreferrer',
                    } }, 'Jake Archibald offline cookbook'),
            ]),
            view_1.h('li', {}, 'Aplicaciones bajo demanda (Buscadores Web)'),
            view_1.h('li', {}, 'Funcionalidad bajo demanda: Code Splitting'),
            view_1.h('li', {}, 'Esta presentación está disponible offline :) (ejemplo)'),
            view_1.h('li', {}, [
                view_1.h('a', { attrs: {
                        href: 'https://hnpwa.com',
                        target: '_blank',
                        rel: 'noopener noreferrer',
                    } }, 'Hacker News PWAs'),
            ]),
        ]),
    ]);
};
exports.interfaces = { view };
const style = {
    base: {
        width: '100%',
        height: '100%',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titlePrimary: {
        padding: '0 20px',
        marginBottom: '10px',
        fontSize: '70px',
        textAlign: 'center',
        color: constants_1.palette.tertiary,
    },
    list: {
        margin: '10px',
        fontSize: '24px',
        $nest: {
            'li': {
                margin: '10px',
            },
        },
    },
};
exports.groups = { style };
//# sourceMappingURL=3.js.map
});
___scope___.file("Root/slides/4.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const view_1 = require("fractal-core/interfaces/view");
const constants_1 = require("../constants");
exports.name = '4';
exports.state = {};
exports.inputs = ctx => ({});
exports.actions = {};
const view = ({ ctx }) => s => {
    let style = ctx.groups.style;
    return view_1.h('div', {
        key: ctx.name,
        class: { [style.base]: true },
    }, [
        view_1.h('div', { class: { [style.titlePrimary]: true } }, 'Desventajas'),
        view_1.h('ul', { class: { [style.list]: true } }, [
            view_1.h('li', {}, 'iOS no soporta SWs (se puede usar el meta tag), máximo en 5 años será implementado'),
            view_1.h('li', {}, 'Las aplicaciones Web son mucho más lentas que las nativas … por ahora … ;)'),
        ]),
    ]);
};
exports.interfaces = { view };
const style = {
    base: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titlePrimary: {
        padding: '0 20px',
        marginBottom: '50px',
        fontSize: '70px',
        textAlign: 'center',
        color: constants_1.palette.tertiary,
    },
    list: {
        margin: '10px',
        fontSize: '24px',
        $nest: {
            'li': {
                margin: '10px',
            },
        },
    },
};
exports.groups = { style };
//# sourceMappingURL=4.js.map
});
___scope___.file("Root/slides/5.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const view_1 = require("fractal-core/interfaces/view");
const constants_1 = require("../constants");
exports.name = '5';
exports.state = {};
exports.inputs = ctx => ({});
exports.actions = {};
const view = ({ ctx }) => s => {
    let style = ctx.groups.style;
    return view_1.h('div', {
        key: ctx.name,
        class: { [style.base]: true },
    }, [
        view_1.h('div', { class: { [style.titlePrimary]: true } }, 'Servo al rescate'),
        view_1.h('ul', { class: { [style.list]: true } }, [
            view_1.h('li', {}, 'Proyecto conjunto de Mozilla, Samsung y otras empresas'),
            view_1.h('li', {}, 'Un motor de renderizado muy rápido, masivamente paralelo e implementado en Rust'),
            view_1.h('li', {}, 'Rust es un lenguaje diseñado con los requerimientos de Servo en mente'),
            view_1.h('li', {}, 'Quantum (Motor de CSS de Servo) actualmente en estado experimental en Firefox y otros componentes de Servo o “cómo reemplazar partes de un avión mientras vuela”'),
            view_1.h('li', {}, 'Run Servo run!'),
        ]),
    ]);
};
exports.interfaces = { view };
const style = {
    base: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titlePrimary: {
        padding: '0 20px',
        marginBottom: '10px',
        fontSize: '70px',
        textAlign: 'center',
        color: constants_1.palette.secondary,
    },
    list: {
        margin: '10px',
        fontSize: '24px',
        $nest: {
            'li': {
                margin: '10px',
            },
        },
    },
};
exports.groups = { style };
//# sourceMappingURL=5.js.map
});
___scope___.file("Root/slides/6.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const view_1 = require("fractal-core/interfaces/view");
const constants_1 = require("../constants");
exports.name = '6';
exports.state = {};
exports.inputs = ctx => ({});
exports.actions = {};
const view = ({ ctx }) => s => {
    let style = ctx.groups.style;
    return view_1.h('div', {
        key: ctx.name,
        class: { [style.base]: true },
    }, [
        view_1.h('div', { class: { [style.titlePrimary]: true } }, '¿Y que con JavaScript?'),
        view_1.h('div', { class: { [style.titleSecondary]: true } }, 'Tendremos un motor de renderizado super rapido, pero JS es lento … :/'),
    ]);
};
exports.interfaces = { view };
const style = {
    base: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titlePrimary: {
        padding: '0 20px',
        marginBottom: '10px',
        fontSize: '70px',
        textAlign: 'center',
        color: constants_1.palette.quaternary,
    },
    titleSecondary: {
        margin: '10px',
        fontSize: '34px',
        textAlign: 'center',
    },
};
exports.groups = { style };
//# sourceMappingURL=6.js.map
});
___scope___.file("Root/slides/7.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const view_1 = require("fractal-core/interfaces/view");
const constants_1 = require("../constants");
exports.name = '7';
exports.state = {};
exports.inputs = ctx => ({});
exports.actions = {};
const view = ({ ctx }) => s => {
    let style = ctx.groups.style;
    return view_1.h('div', {
        key: ctx.name,
        class: { [style.base]: true },
    }, [
        view_1.h('div', { class: { [style.titlePrimary]: true } }, 'WebAssembly FTW'),
        view_1.h('ul', { class: { [style.list]: true } }, [
            view_1.h('li', {}, 'Formato portable, eficiente en tamaño y tiempo de carga, conveniente para compilar en la Web. Un formato binario multiplataforma :O'),
            view_1.h('li', {}, 'Puedes compilar codigo C++ en WASM vía Emscripten, codigo C++ corriendo en el navegador!'),
            view_1.h('li', {}, 'Unreal Engine 3 fue portado en 4 días a ASM.js (precursor de WASM) usando Emscripten:'),
            view_1.h('li', {}, 'Velocidad comparable a la nativa: 50-67% y mejorando'),
        ]),
    ]);
};
exports.interfaces = { view };
const style = {
    base: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titlePrimary: {
        padding: '0 20px',
        marginBottom: '10px',
        fontSize: '70px',
        textAlign: 'center',
        color: constants_1.palette.primary,
    },
    list: {
        margin: '10px',
        fontSize: '24px',
        $nest: {
            'li': {
                margin: '10px',
            },
        },
    },
};
exports.groups = { style };
//# sourceMappingURL=7.js.map
});
___scope___.file("Root/slides/8.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const view_1 = require("fractal-core/interfaces/view");
exports.name = '8';
exports.state = {};
exports.inputs = ctx => ({});
exports.actions = {};
const view = ({ ctx }) => s => {
    let style = ctx.groups.style;
    return view_1.h('div', {
        key: ctx.name,
        class: { [style.base]: true },
    }, [
        view_1.h('iframe', { attrs: {
                width: '700',
                height: '393.75',
                src: 'https://www.youtube.com/embed/BV32Cs_CMqo',
                frameborder: '0',
                allowfullscreen: '',
            } }),
    ]);
};
exports.interfaces = { view };
const style = {
    base: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
};
exports.groups = { style };
//# sourceMappingURL=8.js.map
});
___scope___.file("Root/slides/9.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fractal_core_1 = require("fractal-core");
const view_1 = require("fractal-core/interfaces/view");
const constants_1 = require("../constants");
const scripts_1 = require("../scripts");
exports.name = '9';
exports.state = {
    fnString: '',
    result: '',
};
let _fn = {};
let monacoLoaded = false;
let codeEditor;
let testEditor;
exports.inputs = ({ stateOf, toAct }) => ({
    init: () => {
        let loadEditor = () => {
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: true,
                noSyntaxValidation: false,
            });
            codeEditor = monaco.editor.create(document.getElementById('codeEditor'), {
                value: scripts_1.factorialCode,
                language: 'javascript'
            });
            testEditor = monaco.editor.create(document.getElementById('testEditor'), {
                value: 'fn(5)',
                language: 'javascript',
            });
            monacoLoaded = true;
        };
        if (window.monacoLoaded) {
            loadEditor();
        }
        else {
            ;
            window.onMonacoLoaded = loadEditor;
        }
    },
    compile: async () => {
        let mod;
        let c = scripts_1.c;
        eval('mod = ' + codeEditor.getValue());
        try {
            scripts_1.compileModule(mod).then(ex => {
                _fn.run = ex.fn;
                console.log(_fn.run);
                toAct('SetFnString', _fn.run.toString());
            });
        }
        catch (err) { }
    },
    runTest: async () => {
        let s = stateOf();
        let testCode = testEditor.getValue();
        if (!testCode) {
            return;
        }
        let res;
        let fn = _fn.run;
        eval('res = ' + testCode);
        await toAct('SetResult', res);
    },
});
exports.actions = {
    SetFnString: fractal_core_1.assoc('fnString'),
    SetResult: fractal_core_1.assoc('result'),
};
const view = ({ ctx, ev, act }) => s => {
    let style = ctx.groups.style;
    return view_1.h('div', {
        key: ctx.name,
        class: { [style.base]: true },
    }, [
        view_1.h('div', { class: { [style.titlePrimary]: true } }, 'Time to WASM!'),
        view_1.h('div', { class: { [style.container]: true } }, [
            view_1.h('div', {
                class: { [style.codeEditor]: true },
                attrs: { id: 'codeEditor' },
            }),
            view_1.h('div', { class: { [style.resContainer]: true } }, [
                view_1.h('div', {
                    class: { [style.btn]: true },
                    on: { click: ev('compile') },
                }, 'Compilar'),
                view_1.h('div', { class: { [style.result]: true } }, s.fnString ? s.fnString : 'Sin Compilar'),
            ]),
            view_1.h('div', {
                class: { [style.testEditor]: true },
                attrs: { id: 'testEditor' },
            }),
            view_1.h('div', { class: { [style.resContainer]: true } }, [
                view_1.h('div', {
                    class: { [style.btn]: true },
                    on: { click: ev('runTest') },
                }, 'Ejecutar!'),
                view_1.h('div', { class: { [style.result]: true } }, s.result),
            ]),
        ]),
    ]);
};
exports.interfaces = { view };
const style = {
    base: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titlePrimary: {
        padding: '0 20px',
        marginBottom: '10px',
        fontSize: '70px',
        textAlign: 'center',
        color: constants_1.palette.primary,
    },
    container: {
        margin: '10px',
        width: '100%',
        height: 'calc(100% - 120px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontSize: '24px',
    },
    codeEditor: {
        width: 'calc(100% - 20px)',
        height: '280px',
    },
    testEditor: {
        width: 'calc(100% - 20px)',
        height: '20px',
    },
    resContainer: {
        display: 'flex',
        alignItems: 'center',
    },
    btn: {
        margin: '5px',
        padding: '10px',
        borderRadius: '4px',
        color: constants_1.palette.textSecondary,
        cursor: 'pointer',
        $nest: {
            '&:hover': {
                backgroundColor: constants_1.palette.greyLight,
            },
        },
    },
    result: {
        marginLeft: '20px',
        borderBottom: '1px solid ' + constants_1.palette.greyLight,
    },
};
exports.groups = { style };
//# sourceMappingURL=9.js.map
});
___scope___.file("Root/scripts.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ast_1 = require("../wasm-util/ast");
const emit_1 = require("../wasm-util/emit");
exports.c = ast_1.c;
function arrayBufferToString(buffer) {
    var arr = new Uint8Array(buffer);
    var str = String.fromCharCode.apply(String, arr);
    if (/[\u0080-\uffff]/.test(str)) {
        throw new Error("this string seems to contain (still encoded) multibytes");
    }
    return str;
}
exports.arrayBufferToString = arrayBufferToString;
exports.compileModule = (mod) => {
    const emitter = new emit_1.BufferedEmitter(new ArrayBuffer(mod.z));
    mod.emit(emitter);
    return WebAssembly.compile(emitter.buffer).then(mod => {
        let m = new WebAssembly.Instance(mod);
        return Promise.resolve(m.exports);
    });
};
exports.factorialModule = exports.c.module([
    exports.c.type_section([
        exports.c.func_type([exports.c.i32], exports.c.i32),
    ]),
    exports.c.function_section([
        exports.c.varuint32(0),
    ]),
    exports.c.export_section([
        // exports 'factorial' as function at index 0
        exports.c.export_entry(exports.c.str_ascii('factorial'), exports.c.external_kind.function, exports.c.varuint32(0)),
    ]),
    exports.c.code_section([
        // body of function at index 0:
        exports.c.function_body([], [
            exports.c.if_(exports.c.i32, // i32 = result type of `if` expression
            exports.c.i32.eq(exports.c.get_local(exports.c.i32, 0), exports.c.i32.const(0)), // condition
            [
                exports.c.i32.const(1)
            ], [
                exports.c.i32.mul(exports.c.get_local(exports.c.i32, 0), exports.c.call(exports.c.i32, exports.c.varuint32(0), [
                    exports.c.i32.sub(exports.c.get_local(exports.c.i32, 0), exports.c.i32.const(1))
                ]))
            ])
        ])
    ])
]);
exports.factorial = {};
exports.compileModule(exports.factorialModule).then(ex => {
    exports.factorial.run = ex.factorial;
});
exports.factorialCode = `c.module([
  c.type_section([
    c.func_type([c.i32], c.i32), // type index = 0
  ]),
  c.function_section([
    c.varuint32(0), // function index = 0, using type index 0
  ]),
  c.export_section([
    // exports 'factorial' as function at index 0
    c.export_entry(c.str_ascii('fn'), c.external_kind.function, c.varuint32(0)),
  ]),
  c.code_section([
    // body of function at index 0:
    c.function_body([ /* additional local variables here */ ], [
      c.if_(c.i32, // i32 = result type of 'if' expression
        c.i32.eq(c.get_local(c.i32, 0), c.i32.const(0)), // condition
        [ // then
          c.i32.const(1)
        ],
        [ // else
          c.i32.mul(
            c.get_local(c.i32, 0),
            c.call(c.i32, c.varuint32(0), [ // 0 = function index
              c.i32.sub(c.get_local(c.i32, 0), c.i32.const(1))
            ])
          )
        ]
      )
    ])
  ])
])
`;
//# sourceMappingURL=scripts.js.map
});
___scope___.file("wasm-util/ast.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utf8_1 = require("./utf8");
const DEBUG = false;
const assert = DEBUG ? function (cond, msg) {
    if (!cond) {
        throw new Error('assertion failure');
    }
} : function () { };
//——————————————————————————————————————————————————————————————————————————————
// Type tags
const T = {
    // Atoms
    uint8: Symbol('u8'),
    uint16: Symbol('u16'),
    uint32: Symbol('u32'),
    varuint1: Symbol('vu1'),
    varuint7: Symbol('vu7'),
    varuint32: Symbol('vu32'),
    varint7: Symbol('vs7'),
    varint32: Symbol('vs32'),
    varint64: Symbol('vs64'),
    float32: Symbol('f32'),
    float64: Symbol('f64'),
    data: Symbol('data'),
    type: Symbol('type'),
    external_kind: Symbol('type'),
    // Instructions
    instr: Symbol('instr'),
    instr_pre: Symbol('instr_pre'),
    instr_pre1: Symbol('instr_pre1'),
    instr_imm1: Symbol('instr_imm1'),
    instr_imm1_post: Symbol('instr_imm1_post'),
    instr_pre_imm: Symbol('instr_pre_imm'),
    instr_pre_imm_post: Symbol('instr_pre_imm_post'),
    // Cells
    module: Symbol('module'),
    section: Symbol('section'),
    import_entry: Symbol('import_entry'),
    export_entry: Symbol('export_entry'),
    local_entry: Symbol('local_entry'),
    func_type: Symbol('func_type'),
    table_type: Symbol('table_type'),
    memory_type: Symbol('memory_type'),
    global_type: Symbol('global_type'),
    resizable_limits: Symbol('resizable_limits'),
    global_variable: Symbol('global_variable'),
    init_expr: Symbol('init_expr'),
    elem_segment: Symbol('elem_segment'),
    data_segment: Symbol('data_segment'),
    function_body: Symbol('function_body'),
    str: Symbol('str'),
};
//——————————————————————————————————————————————————————————————————————————————
// node structs
const writev = (e, objs) => objs.reduce((e, n) => n.emit(e), e);
const sumz = function (n) {
    let sum = 0;
    for (let i = 0, L = n.length; i != L; ++i) {
        sum += n[i].z;
    }
    return sum;
};
const readVarInt7 = (byte) => byte < 64 ? byte : -(128 - byte);
class bytes_atom {
    constructor(t, v) {
        this.t = t;
        this.z = v.length;
        this.v = v;
    }
    emit(e) { return e.writeBytes(this.v); }
}
class val_atom {
    constructor(t, z, v) { this.t = t; this.z = z; this.v = v; }
    emit(e) { return e; } // override in subclasses
}
class bytesval_atom extends val_atom {
    constructor(t, v, bytes) {
        super(t, bytes.length, v);
        this.bytes = bytes;
    }
    emit(e) { return e.writeBytes(this.bytes); }
}
class u32_atom extends val_atom {
    constructor(v) { super(T.uint32, 4, v); }
    emit(e) { return e.writeU32(this.v); }
}
class f32_atom extends val_atom {
    constructor(v) { super(T.float32, 4, v); }
    emit(e) { return e.writeF32(this.v); }
}
class f64_atom extends val_atom {
    constructor(v) { super(T.float64, 8, v); }
    emit(e) { return e.writeF64(this.v); }
}
class u8_atom extends val_atom {
    constructor(t, v) { super(t, 1, v); }
    emit(e) { return e.writeU8(this.v); }
}
class type_atom extends u8_atom {
    constructor(v, b) { super(T.type, v); this.b = b; }
    emit(e) { return e.writeU8(this.b); }
}
class str_atom {
    constructor(len, v) {
        assert(len.v == v.length);
        this.t = T.str;
        this.z = len.z + v.length;
        this.v = v;
        this.len = len;
    }
    emit(e) { return this.len.emit(e).writeBytes(this.v); }
}
class cell {
    constructor(t, v) {
        this.t = t;
        this.z = sumz(v);
        this.v = v;
    }
    emit(e) { return writev(e, this.v); }
}
//—————————————————————————————————————————————
// Instructions
class instr_atom extends u8_atom {
    constructor(v, r) { super(T.instr, v); this.r = r; }
}
class instr_cell {
    constructor(t, op, r, z) {
        this.t = t;
        this.z = z;
        this.v = op;
        this.r = r;
    }
    emit(e) { return e; }
}
class instr_pre1 extends instr_cell {
    constructor(op, r, pre) {
        super(T.instr_pre1, op, r, 1 + pre.z);
        this.pre = pre;
    }
    emit(e) { return this.pre.emit(e).writeU8(this.v); }
}
class instr_imm1 extends instr_cell {
    constructor(op, r, imm) {
        super(T.instr_imm1, op, r, 1 + imm.z);
        this.imm = imm;
    }
    emit(e) { return this.imm.emit(e.writeU8(this.v)); }
}
class instr_pre extends instr_cell {
    constructor(op, r, pre) {
        super(T.instr_pre, op, r, 1 + sumz(pre));
        this.pre = pre;
    }
    emit(e) { return writev(e, this.pre).writeU8(this.v); }
}
class instr_imm1_post extends instr_cell {
    constructor(op, r, imm, post) {
        super(T.instr_imm1_post, op, r, 1 + imm.z + sumz(post));
        this.imm = imm;
        this.post = post;
    }
    emit(e) { return writev(this.imm.emit(e.writeU8(this.v)), this.post); }
}
class instr_pre_imm extends instr_cell {
    constructor(op, r, pre, imm) {
        super(T.instr_pre_imm, op, r, 1 + sumz(pre) + sumz(imm));
        this.pre = pre;
        this.imm = imm;
    }
    emit(e) { return writev(writev(e, this.pre).writeU8(this.v), this.imm); }
}
class instr_pre_imm_post extends instr_cell {
    constructor(op, r, pre, imm, post) {
        super(T.instr_pre_imm_post, op, r, 1 + sumz(pre) + sumz(imm) + sumz(post));
        this.pre = pre;
        this.imm = imm;
        this.post = post;
    }
    emit(e) {
        return writev(writev(writev(e, this.pre).writeU8(this.v), this.imm), this.post);
    }
}
function maprange(start, stop, fn) {
    let a = [];
    while (start < stop) {
        let v = fn(start);
        if (v !== undefined) {
            a.push(v);
        }
        start += 1;
    }
    return a;
}
//——————————————————————————————————————————————————————————————————————————————
// constructors
const uint8Cache = maprange(0, 16, v => new u8_atom(T.uint8, v));
const varUint7Cache = maprange(0, 16, v => new u8_atom(T.varuint7, v));
const varUint32Cache = maprange(0, 16, v => new u8_atom(T.varuint32, v));
const varuint1_0 = new u8_atom(T.varuint1, 0);
const varuint1_1 = new u8_atom(T.varuint1, 1);
function uint8(v) {
    return uint8Cache[v] || new u8_atom(T.uint8, v);
}
function uint32(v) { return new u32_atom(v); }
function float32(v) { return new f32_atom(v); }
function float64(v) { return new f64_atom(v); }
// LEB128-encoded variable-length integers: (N = bits)
//   unsigned range: [0, 2^N-1]
//   signed range:   [-2^(N-1), +2^(N-1)-1]
function varuint1(v) {
    return v ? varuint1_1 : varuint1_0;
}
function varuint7(v) {
    assert(v >= 0 && v <= 128);
    return varUint7Cache[v] || new u8_atom(T.varuint7, v);
}
function varuint32(value) {
    const c = varUint32Cache[value];
    if (c) {
        return c;
    }
    assert(value >= 0 && value <= 0xffffffff);
    let v = value;
    const bytes = [];
    while (v >= 0x80) {
        bytes.push((v & 0x7f) | 0x80);
        v >>>= 7;
    }
    bytes.push(v);
    return new bytesval_atom(T.varuint32, value, bytes);
}
function varint7(value) {
    assert(value >= -64 && value <= 63);
    return new u8_atom(T.varint7, value < 0 ? (128 + value) : value);
}
function encVarIntN(v) {
    // FIXME: broken for values larger than uint32
    const bytes = [];
    while (true) {
        let b = v & 0x7f;
        if (-64 <= v && v < 64) {
            bytes.push(b);
            break;
        }
        v >>= 7; // Note: sign-propagating right shift
        bytes.push(b | 0x80);
    }
    return bytes;
}
function varint32(value) {
    assert(value >= -0x80000000 && value <= 0x7fffffff);
    return new bytesval_atom(T.varint32, value, encVarIntN(value));
}
function varint64(value) {
    // Here be dragons! Not all negative 64bit numbers can be represented with
    // JavaScript numbers. The ECMAScript double type has 53 bits of integer
    // precision. We thus assert this range
    assert(value >= Number.MIN_SAFE_INTEGER && value <= Number.MAX_SAFE_INTEGER);
    return new bytesval_atom(T.varint64, value, encVarIntN(value));
}
// Language types
const AnyFunc = new type_atom(-0x10, 0x70);
const Func = new type_atom(-0x20, 0x60);
const EmptyBlock = new type_atom(-0x40, 0x40);
const Void = EmptyBlock;
const external_kind_function = new u8_atom(T.external_kind, 0);
const external_kind_table = new u8_atom(T.external_kind, 1);
const external_kind_memory = new u8_atom(T.external_kind, 2);
const external_kind_global = new u8_atom(T.external_kind, 3);
const str = (data) => new str_atom(varuint32(data.length), data);
const sect_id_custom = varuint7(0);
const sect_id_type = varuint7(1);
const sect_id_import = varuint7(2);
const sect_id_function = varuint7(3);
const sect_id_table = varuint7(4);
const sect_id_memory = varuint7(5);
const sect_id_global = varuint7(6);
const sect_id_export = varuint7(7);
const sect_id_start = varuint7(8);
const sect_id_element = varuint7(9);
const sect_id_code = varuint7(10);
const sect_id_data = varuint7(11);
exports.sect_id = {
    custom: sect_id_custom,
    type: sect_id_type,
    import: sect_id_import,
    function: sect_id_function,
    table: sect_id_table,
    memory: sect_id_memory,
    global: sect_id_global,
    export: sect_id_export,
    start: sect_id_start,
    element: sect_id_element,
    code: sect_id_code,
    data: sect_id_data,
};
function section(id, imm, payload) {
    return new cell(T.section, [id, varuint32(imm.z + sumz(payload)), imm, ...payload]);
}
const memload = (op, r, mi, addr) => new instr_pre_imm(op, r, [addr], mi);
const memstore = (op, mi, addr, v) => new instr_pre_imm(op, Void, [addr, v], mi);
// memAddrIsAligned returns true if the memory operation will actually be aligned.
// Note: natAl and al should be encoded as log2(bits), i.e. 32bit = 2
const addrIsAligned = (natAl, al, offs, addr) => al <= natAl &&
    ((addr + offs) % [1, 2, 4, 8][al]) == 0;
class i32ops extends type_atom {
    // Constants
    constv(v) { return new instr_imm1(0x41, this, v); }
    const(v) { return this.constv(varint32(v)); }
    // Memory
    load(mi, addr) { return memload(0x28, this, mi, addr); }
    load8_s(mi, addr) { return memload(0x2c, this, mi, addr); }
    load8_u(mi, addr) { return memload(0x2d, this, mi, addr); }
    load16_s(mi, addr) { return memload(0x2e, this, mi, addr); }
    load16_u(mi, addr) { return memload(0x2f, this, mi, addr); }
    store(mi, addr, v) { return memstore(0x36, mi, addr, v); }
    store8(mi, addr, v) { return memstore(0x3a, mi, addr, v); }
    store16(mi, addr, v) { return memstore(0x3b, mi, addr, v); }
    addrIsAligned(mi, addr) { return addrIsAligned(2, mi[0].v, mi[1].v, addr); }
    // Comparison
    eqz(a) { return new instr_pre1(0x45, this, a); }
    eq(a, b) { return new instr_pre(0x46, this, [a, b]); }
    ne(a, b) { return new instr_pre(0x47, this, [a, b]); }
    lt_s(a, b) { return new instr_pre(0x48, this, [a, b]); }
    lt_u(a, b) { return new instr_pre(0x49, this, [a, b]); }
    gt_s(a, b) { return new instr_pre(0x4a, this, [a, b]); }
    gt_u(a, b) { return new instr_pre(0x4b, this, [a, b]); }
    le_s(a, b) { return new instr_pre(0x4c, this, [a, b]); }
    le_u(a, b) { return new instr_pre(0x4d, this, [a, b]); }
    ge_s(a, b) { return new instr_pre(0x4e, this, [a, b]); }
    ge_u(a, b) { return new instr_pre(0x4f, this, [a, b]); }
    // Numeric
    clz(a) { return new instr_pre1(0x67, this, a); }
    ctz(a) { return new instr_pre1(0x68, this, a); }
    popcnt(a) { return new instr_pre1(0x69, this, a); }
    add(a, b) { return new instr_pre(0x6a, this, [a, b]); }
    sub(a, b) { return new instr_pre(0x6b, this, [a, b]); }
    mul(a, b) { return new instr_pre(0x6c, this, [a, b]); }
    div_s(a, b) { return new instr_pre(0x6d, this, [a, b]); }
    div_u(a, b) { return new instr_pre(0x6e, this, [a, b]); }
    rem_s(a, b) { return new instr_pre(0x6f, this, [a, b]); }
    rem_u(a, b) { return new instr_pre(0x70, this, [a, b]); }
    and(a, b) { return new instr_pre(0x71, this, [a, b]); }
    or(a, b) { return new instr_pre(0x72, this, [a, b]); }
    xor(a, b) { return new instr_pre(0x73, this, [a, b]); }
    shl(a, b) { return new instr_pre(0x74, this, [a, b]); }
    shr_s(a, b) { return new instr_pre(0x75, this, [a, b]); }
    shr_u(a, b) { return new instr_pre(0x76, this, [a, b]); }
    rotl(a, b) { return new instr_pre(0x77, this, [a, b]); }
    rotr(a, b) { return new instr_pre(0x78, this, [a, b]); }
    // Conversion
    wrap_i64(a) { return new instr_pre1(0xa7, this, a); }
    trunc_s_f32(a) { return new instr_pre1(0xa8, this, a); }
    trunc_u_f32(a) { return new instr_pre1(0xa9, this, a); }
    trunc_s_f64(a) { return new instr_pre1(0xaa, this, a); }
    trunc_u_f64(a) { return new instr_pre1(0xab, this, a); }
    reinterpret_f32(a) { return new instr_pre1(0xbc, this, a); }
}
class i64ops extends type_atom {
    // Constants
    constv(v) { return new instr_imm1(0x42, this, v); }
    const(v) { return this.constv(varint64(v)); }
    // Memory
    load(mi, addr) { return memload(0x29, this, mi, addr); }
    load8_s(mi, addr) { return memload(0x30, this, mi, addr); }
    load8_u(mi, addr) { return memload(0x31, this, mi, addr); }
    load16_s(mi, addr) { return memload(0x32, this, mi, addr); }
    load16_u(mi, addr) { return memload(0x33, this, mi, addr); }
    load32_s(mi, addr) { return memload(0x34, this, mi, addr); }
    load32_u(mi, addr) { return memload(0x35, this, mi, addr); }
    store(mi, addr, v) { return memstore(0x37, mi, addr, v); }
    store8(mi, addr, v) { return memstore(0x3c, mi, addr, v); }
    store16(mi, addr, v) { return memstore(0x3d, mi, addr, v); }
    store32(mi, addr, v) { return memstore(0x3e, mi, addr, v); }
    addrIsAligned(mi, addr) { return addrIsAligned(3, mi[0].v, mi[1].v, addr); }
    // Comparison
    eqz(a) { return new instr_pre1(0x50, this, a); }
    eq(a, b) { return new instr_pre(0x51, this, [a, b]); }
    ne(a, b) { return new instr_pre(0x52, this, [a, b]); }
    lt_s(a, b) { return new instr_pre(0x53, this, [a, b]); }
    lt_u(a, b) { return new instr_pre(0x54, this, [a, b]); }
    gt_s(a, b) { return new instr_pre(0x55, this, [a, b]); }
    gt_u(a, b) { return new instr_pre(0x56, this, [a, b]); }
    le_s(a, b) { return new instr_pre(0x57, this, [a, b]); }
    le_u(a, b) { return new instr_pre(0x58, this, [a, b]); }
    ge_s(a, b) { return new instr_pre(0x59, this, [a, b]); }
    ge_u(a, b) { return new instr_pre(0x5a, this, [a, b]); }
    // Numeric
    clz(a) { return new instr_pre1(0x79, this, a); }
    ctz(a) { return new instr_pre1(0x7a, this, a); }
    popcnt(a) { return new instr_pre1(0x7b, this, a); }
    add(a, b) { return new instr_pre(0x7c, this, [a, b]); }
    sub(a, b) { return new instr_pre(0x7d, this, [a, b]); }
    mul(a, b) { return new instr_pre(0x7e, this, [a, b]); }
    div_s(a, b) { return new instr_pre(0x7f, this, [a, b]); }
    div_u(a, b) { return new instr_pre(0x80, this, [a, b]); }
    rem_s(a, b) { return new instr_pre(0x81, this, [a, b]); }
    rem_u(a, b) { return new instr_pre(0x82, this, [a, b]); }
    and(a, b) { return new instr_pre(0x83, this, [a, b]); }
    or(a, b) { return new instr_pre(0x84, this, [a, b]); }
    xor(a, b) { return new instr_pre(0x85, this, [a, b]); }
    shl(a, b) { return new instr_pre(0x86, this, [a, b]); }
    shr_s(a, b) { return new instr_pre(0x87, this, [a, b]); }
    shr_u(a, b) { return new instr_pre(0x88, this, [a, b]); }
    rotl(a, b) { return new instr_pre(0x89, this, [a, b]); }
    rotr(a, b) { return new instr_pre(0x8a, this, [a, b]); }
    // Conversions
    extend_s_i32(a) { return new instr_pre1(0xac, this, a); }
    extend_u_i32(a) { return new instr_pre1(0xad, this, a); }
    trunc_s_f32(a) { return new instr_pre1(0xae, this, a); }
    trunc_u_f32(a) { return new instr_pre1(0xaf, this, a); }
    trunc_s_f64(a) { return new instr_pre1(0xb0, this, a); }
    trunc_u_f64(a) { return new instr_pre1(0xb1, this, a); }
    reinterpret_f64(a) { return new instr_pre1(0xbd, this, a); }
}
class f32ops extends type_atom {
    // Constants
    constv(v) { return new instr_imm1(0x43, this, v); }
    const(v) { return this.constv(float32(v)); }
    // Memory
    load(mi, addr) { return memload(0x2a, this, mi, addr); }
    store(mi, addr, v) { return memstore(0x38, mi, addr, v); }
    addrIsAligned(mi, addr) { return addrIsAligned(2, mi[0].v, mi[1].v, addr); }
    // Comparison
    eq(a, b) { return new instr_pre(0x5b, this, [a, b]); }
    ne(a, b) { return new instr_pre(0x5c, this, [a, b]); }
    lt(a, b) { return new instr_pre(0x5d, this, [a, b]); }
    gt(a, b) { return new instr_pre(0x5e, this, [a, b]); }
    le(a, b) { return new instr_pre(0x5f, this, [a, b]); }
    ge(a, b) { return new instr_pre(0x60, this, [a, b]); }
    // Numeric
    abs(a) { return new instr_pre1(0x8b, this, a); }
    neg(a) { return new instr_pre1(0x8c, this, a); }
    ceil(a) { return new instr_pre1(0x8d, this, a); }
    floor(a) { return new instr_pre1(0x8e, this, a); }
    trunc(a) { return new instr_pre1(0x8f, this, a); }
    nearest(a) { return new instr_pre1(0x90, this, a); }
    sqrt(a) { return new instr_pre1(0x91, this, a); }
    add(a, b) { return new instr_pre(0x92, this, [a, b]); }
    sub(a, b) { return new instr_pre(0x93, this, [a, b]); }
    mul(a, b) { return new instr_pre(0x94, this, [a, b]); }
    div(a, b) { return new instr_pre(0x95, this, [a, b]); }
    min(a, b) { return new instr_pre(0x96, this, [a, b]); }
    max(a, b) { return new instr_pre(0x97, this, [a, b]); }
    copysign(a, b) { return new instr_pre(0x98, this, [a, b]); }
    // Conversion
    convert_s_i32(a) { return new instr_pre1(0xb2, this, a); }
    convert_u_i32(a) { return new instr_pre1(0xb3, this, a); }
    convert_s_i64(a) { return new instr_pre1(0xb4, this, a); }
    convert_u_i64(a) { return new instr_pre1(0xb5, this, a); }
    demote_f64(a) { return new instr_pre1(0xb6, this, a); }
    reinterpret_i32(a) { return new instr_pre1(0xbe, this, a); }
}
class f64ops extends type_atom {
    // Constants
    constv(v) { return new instr_imm1(0x44, this, v); }
    const(v) { return this.constv(float64(v)); }
    // Memory
    load(mi, addr) { return memload(0x2b, this, mi, addr); }
    store(mi, addr, v) { return memstore(0x39, mi, addr, v); }
    addrIsAligned(mi, addr) { return addrIsAligned(3, mi[0].v, mi[1].v, addr); }
    // Comparison
    eq(a, b) { return new instr_pre(0x61, this, [a, b]); }
    ne(a, b) { return new instr_pre(0x62, this, [a, b]); }
    lt(a, b) { return new instr_pre(0x63, this, [a, b]); }
    gt(a, b) { return new instr_pre(0x64, this, [a, b]); }
    le(a, b) { return new instr_pre(0x65, this, [a, b]); }
    ge(a, b) { return new instr_pre(0x66, this, [a, b]); }
    // Numeric
    abs(a) { return new instr_pre1(0x99, this, a); }
    neg(a) { return new instr_pre1(0x9a, this, a); }
    ceil(a) { return new instr_pre1(0x9b, this, a); }
    floor(a) { return new instr_pre1(0x9c, this, a); }
    trunc(a) { return new instr_pre1(0x9d, this, a); }
    nearest(a) { return new instr_pre1(0x9e, this, a); }
    sqrt(a) { return new instr_pre1(0x9f, this, a); }
    add(a, b) { return new instr_pre(0xa0, this, [a, b]); }
    sub(a, b) { return new instr_pre(0xa1, this, [a, b]); }
    mul(a, b) { return new instr_pre(0xa2, this, [a, b]); }
    div(a, b) { return new instr_pre(0xa3, this, [a, b]); }
    min(a, b) { return new instr_pre(0xa4, this, [a, b]); }
    max(a, b) { return new instr_pre(0xa5, this, [a, b]); }
    copysign(a, b) { return new instr_pre(0xa6, this, [a, b]); }
    // Conversions
    convert_s_i32(a) { return new instr_pre1(0xb7, this, a); }
    convert_u_i32(a) { return new instr_pre1(0xb8, this, a); }
    convert_s_i64(a) { return new instr_pre1(0xb9, this, a); }
    convert_u_i64(a) { return new instr_pre1(0xba, this, a); }
    promote_f32(a) { return new instr_pre1(0xbb, this, a); }
    reinterpret_i64(a) { return new instr_pre1(0xbf, this, a); }
}
const magic = uint32(0x6d736100);
const latestVersion = uint32(0x1);
const end = new instr_atom(0x0b, Void);
const elseOp = new instr_atom(0x05, Void);
function if_(r, cond, then_, else_) {
    assert(r === then_[then_.length - 1].r);
    assert(!else_ || else_.length == 0 || r === else_[else_.length - 1].r);
    return new instr_pre_imm_post(0x04, r, [cond], // pre
    [r], // imm
    // post:
    else_ ? [...then_, elseOp, ...else_, end] :
        [...then_, end]);
}
const return_ = (value) => new instr_pre1(0x0f, value.r, value);
exports.t = T;
exports.c = {
    uint8,
    uint32,
    float32,
    float64,
    varuint1,
    varuint7,
    varuint32,
    varint7,
    varint32,
    varint64,
    any_func: AnyFunc,
    func: Func,
    empty_block: EmptyBlock,
    void: Void, void_: Void,
    external_kind: {
        function: external_kind_function,
        table: external_kind_table,
        memory: external_kind_memory,
        global: external_kind_global,
    },
    data(buf) {
        return new bytes_atom(T.data, buf);
    },
    str,
    str_ascii(text) {
        const bytes = [];
        for (let i = 0, L = text.length; i != L; ++i) {
            bytes[i] = 0xff & text.charCodeAt(i);
        }
        return str(bytes);
    },
    str_utf8: (text) => str(utf8_1.utf8.encode(text)),
    // If you are targeting a pre-MVP version, provide the desired version number (e.g. `0xd`).
    // If not provided or falsy, the latest stable version is used.
    module(sections, version) {
        const v = version ? uint32(version) : latestVersion;
        return new cell(T.module, [magic, v, ...sections]);
    },
    custom_section: (name, payload) => section(sect_id_custom, name, payload),
    type_section: (types) => section(sect_id_type, varuint32(types.length), types),
    import_section: (entries) => section(sect_id_import, varuint32(entries.length), entries),
    function_section: (types) => section(sect_id_function, varuint32(types.length), types),
    table_section: (types) => section(sect_id_table, varuint32(types.length), types),
    memory_section: (limits) => section(sect_id_memory, varuint32(limits.length), limits),
    global_section: (globals) => section(sect_id_global, varuint32(globals.length), globals),
    export_section: (exports) => section(sect_id_export, varuint32(exports.length), exports),
    start_section: (funcIndex) => section(sect_id_start, funcIndex, []),
    element_section: (entries) => section(sect_id_element, varuint32(entries.length), entries),
    code_section: (bodies) => section(sect_id_code, varuint32(bodies.length), bodies),
    data_section: (entries) => section(sect_id_data, varuint32(entries.length), entries),
    function_import_entry: (module, field, typeIndex) => new cell(T.import_entry, [
        module, field, external_kind_function, typeIndex
    ]),
    table_import_entry: (module, field, type) => new cell(T.import_entry, [module, field, external_kind_table, type]),
    memory_import_entry: (module, field, limits) => new cell(T.import_entry, [module, field, external_kind_memory, limits]),
    global_import_entry: (module, field, type) => new cell(T.import_entry, [module, field, external_kind_global, type]),
    export_entry: (field, kind, index) => new cell(T.export_entry, [field, kind, index]),
    elem_segment: (index, offset, funcIndex) => new cell(T.elem_segment, [
        index, offset, varuint32(funcIndex.length), ...funcIndex
    ]),
    data_segment: (index, offset, data) => new cell(T.data_segment, [index, offset, varuint32(data.z), data]),
    func_type(paramTypes, returnType) {
        const paramLen = varuint32(paramTypes.length);
        return new cell(T.func_type, returnType ? [Func, paramLen, ...paramTypes, varuint1_1, returnType]
            : [Func, paramLen, ...paramTypes, varuint1_0]);
    },
    table_type(type, limits) {
        assert(type.v == AnyFunc.v); // WASM MVP limitation
        return new cell(T.table_type, [type, limits]);
    },
    global_type: (contentType, mutable) => new cell(T.global_type, [
        contentType, mutable ? varuint1_1 : varuint1_0
    ]),
    // expressed in number of memory pages (not bytes; pagesize=64KiB)
    resizable_limits: (initial, maximum) => new cell(T.resizable_limits, maximum ?
        [varuint1_1, initial, maximum] : [varuint1_0, initial]),
    global_variable: (type, init) => new cell(T.global_variable, [type, init]),
    init_expr: (expr) => new cell(T.init_expr, [...expr, end]),
    function_body(locals, code) {
        const localCount = varuint32(locals.length);
        return new cell(T.function_body, [
            varuint32(localCount.z + sumz(locals) + sumz(code) + 1),
            localCount, ...locals, ...code, end
        ]);
    },
    local_entry: (count, type) => new cell(T.local_entry, [count, type]),
    // Semantics of the WebAssembly stack machine:
    // - Control instructions pop their argument value(s) off the stack, may change
    //   the program counter, and push result value(s) onto the stack.
    // - Simple instructions pop their argument value(s) from the stack, apply an
    //   operator to the values, and then push the result value(s) onto the stack,
    //   followed by an implicit advancement of the program counter.
    unreachable: new instr_atom(0x00, Void),
    nop: new instr_atom(0x01, Void),
    // begin a block which can also form CF loops
    block(r, body) {
        assert(r === body[body.length - 1].r);
        return new instr_imm1_post(0x02, r, r, [...body, end]);
    },
    void_block(body) {
        assert(body.length == 0 || Void === body[body.length - 1].r);
        return new instr_imm1_post(0x02, Void, EmptyBlock, [...body, end]);
    },
    // begin a block which can also form CF loops
    loop(r, body) {
        assert(r === body[body.length - 1].r);
        return new instr_imm1_post(0x03, r, r, [...body, end]);
    },
    void_loop(body) {
        assert(body.length == 0 || Void === body[body.length - 1].r);
        return new instr_imm1_post(0x03, Void, EmptyBlock, [...body, end]);
    },
    if: if_, if_,
    end: end,
    // Branch to a given label (relative depth) in an enclosing construct.
    // Note:
    // - "branching" to a block correspond to a "break" statement
    // - "branching" to a loop correspond to a "continue" statement
    br: (relDepth) => new instr_imm1(0x0c, Void, varuint32(relDepth)),
    // Conditionall branch to a given label in an enclosing construct.
    // When condition is false, this is equivalent to a "Nop" operation.
    // When condition is true, this is equivalent to a "Br" operation.
    br_if: (relDepth, cond) => new instr_pre_imm(0x0d, Void, [cond], [varuint32(relDepth)]),
    // Jump table which jumps to a label in an enclosing construct.
    // A br_table consists of a zero-based array of labels, a default label,
    // and an index operand. A br_table jumps to the label indexed in the
    // array or the default label if the index is out of bounds.
    br_table: (targetLabels, defaultLabel, index) => new instr_pre_imm(0x0e, Void, [index], [varuint32(targetLabels.length), ...targetLabels, defaultLabel]),
    // return zero or one value from this function
    return: return_, return_,
    return_void: new instr_atom(0x0f, Void),
    // Calling
    call(r, funcIndex, args) {
        return new instr_pre_imm(0x10, r, args, [funcIndex]);
    },
    call_indirect(r, funcIndex, args) {
        return new instr_pre_imm(0x11, r, args, [funcIndex, varuint1_0]);
    },
    // drop discards the value of its operand
    // R should be the value on the stack "under" the operand. E.g. with a stack:
    //   I32  top
    //   F64  ...
    //   F32  bottom
    // drop
    //   F64  top
    //   F32  bottom
    // i.e. R=F64
    drop(r, n) {
        return new instr_pre1(0x1a, r, n);
    },
    // select one of two values based on condition
    select(cond, trueRes, falseRes) {
        assert(trueRes.r === falseRes.r);
        return new instr_pre(0x1b, trueRes.r, [trueRes, falseRes, cond]);
    },
    // Variable access
    get_local(r, localIndex) {
        return new instr_imm1(0x20, r, varuint32(localIndex));
    },
    set_local(localIndex, expr) {
        return new instr_pre_imm(0x21, Void, [expr], [varuint32(localIndex)]);
    },
    tee_local(localIndex, expr) {
        return new instr_pre_imm(0x22, expr.r, [expr], [varuint32(localIndex)]);
    },
    get_global(r, globalIndex) {
        return new instr_imm1(0x23, r, varuint32(globalIndex));
    },
    set_global(globalIndex, expr) {
        return new instr_pre_imm(0x24, Void, [expr], [varuint32(globalIndex)]);
    },
    // Memory
    current_memory() {
        return new instr_imm1(0x3f, exports.c.i32, varuint1_0);
    },
    // Grow the size of memory by `delta` memory pages.
    // Returns the previous memory size in units of pages or -1 on failure.
    grow_memory(delta) {
        assert(delta.v >= 0);
        return new instr_pre_imm(0x40, exports.c.i32, [delta], [varuint1_0]);
    },
    // MemImm: Alignment          Offset
    align8: [varUint32Cache[0], varUint32Cache[0]],
    align16: [varUint32Cache[1], varUint32Cache[0]],
    align32: [varUint32Cache[2], varUint32Cache[0]],
    align64: [varUint32Cache[3], varUint32Cache[0]],
    i32: new i32ops(-0x01, 0x7f),
    i64: new i64ops(-0x02, 0x7e),
    f32: new f32ops(-0x03, 0x7d),
    f64: new f64ops(-0x04, 0x7c),
};
// access helpers
exports.get = {
    sections(m) {
        return m.v.slice(2); // 0=magic, 1=version, 2...=Section[]
    },
    section(m, id) {
        let ido = (typeof id != 'object') ? varuint7(id) : id;
        for (let i = 2; i < m.v.length; ++i) {
            let section = m.v[i];
            if (section.v[0] === ido) {
                return section;
            }
        }
    },
    function_bodies(s) {
        return {
            [Symbol.iterator](startIndex) {
                let index = 3 + (startIndex || 0);
                return {
                    next() {
                        const funcBody = s.v[index];
                        if (!funcBody) {
                            return { done: true, value: null };
                        }
                        let localCount = funcBody.v[1];
                        return {
                            done: false,
                            value: {
                                index: index++,
                                locals: funcBody.v.slice(2, localCount.v + 2),
                                code: funcBody.v.slice(2 + localCount.v, funcBody.v.length - 1)
                                //  -1 to skip terminating `end`
                            }
                        };
                    }
                };
            }
        };
    },
};
//# sourceMappingURL=ast.js.map
});
___scope___.file("wasm-util/utf8.js", function(exports, require, module, __filename, __dirname){
/* fuse:injection: */ var Buffer = require("buffer").Buffer;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ——————————————————————————————————————————————————————————————————————————
exports.utf8 = typeof TextEncoder != 'undefined' ? (function () {
    // Modern browsers
    const enc = new TextEncoder('utf-8');
    const dec = new TextDecoder('utf-8');
    return {
        encode(text) {
            return enc.encode(text);
        },
        decode(b) {
            return dec.decode(b.buffer != undefined ? b :
                new Uint8Array(b));
        },
    };
})() : typeof Buffer != 'undefined' ? {
    // Nodejs
    encode(text) {
        return new Uint8Array(Buffer.from(text, 'utf-8'));
    },
    decode(b) {
        return (b.buffer != undefined ?
            Buffer.from(b.buffer, b.byteOffset, b.byteLength) :
            Buffer.from(b)).toString('utf8');
    }
} : {
    // Some other pesky JS environment
    encode(text) {
        let asciiBytes = [];
        for (let i = 0, L = text.length; i != L; ++i) {
            asciiBytes[i] = 0xff & text.charCodeAt(i);
        }
        return new Uint8Array(asciiBytes);
    },
    decode(buf) {
        return '';
    }
};
//# sourceMappingURL=utf8.js.map
});
___scope___.file("wasm-util/emit.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Emitter that writes to an ArrayBuffer
class BufferedEmitter {
    constructor(buffer) {
        this.buffer = buffer;
        this.view = new DataView(this.buffer);
        this.length = 0;
    }
    writeU8(v) {
        this.view.setUint8(this.length++, v);
        return this;
    }
    writeU16(v) {
        this.view.setUint16(this.length, v, true);
        this.length += 2;
        return this;
    }
    writeU32(v) {
        this.view.setUint32(this.length, v, true);
        this.length += 4;
        return this;
    }
    writeF32(v) {
        this.view.setFloat32(this.length, v, true);
        this.length += 4;
        return this;
    }
    writeF64(v) {
        this.view.setFloat64(this.length, v, true);
        this.length += 8;
        return this;
    }
    writeBytes(bytes) {
        for (let i = 0, L = bytes.length; i != L; ++i) {
            this.view.setUint8(this.length++, bytes[i]);
        }
        return this;
    }
}
exports.BufferedEmitter = BufferedEmitter;
// Note: you can use repr.reprBuffer(ArrayBuffer, Writer)
// to print an ASCII representation of a buffer.
//# sourceMappingURL=emit.js.map
});
___scope___.file("Root/slides/10.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const view_1 = require("fractal-core/interfaces/view");
const constants_1 = require("../constants");
exports.name = '10';
exports.state = {
    fnString: '',
    result: '',
};
let monacoLoaded = false;
let codeEditor;
exports.inputs = ({ stateOf, toAct }) => ({
    init: () => {
        let loadEditor = () => {
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: true,
                noSyntaxValidation: false,
            });
            codeEditor = monaco.editor.create(document.getElementById('codeEditor'), {
                value: exampleCode,
                language: 'javascript'
            });
            monacoLoaded = true;
        };
        if (window.monacoLoaded) {
            loadEditor();
        }
        else {
            ;
            window.onMonacoLoaded = loadEditor;
        }
    },
});
exports.actions = {};
const view = ({ ctx, ev, act }) => s => {
    let style = ctx.groups.style;
    return view_1.h('div', {
        key: ctx.name,
        class: { [style.base]: true },
    }, [
        view_1.h('div', { class: { [style.titlePrimary]: true } }, 'Si! esto ya está disponible en la Web'),
        view_1.h('div', { class: { [style.container]: true } }, [
            view_1.h('div', { class: { [style.text]: true } }, [
                'Funciones asíncronas, arrow functions, let, const, template strings, rest / spread, destructuring, etc … ',
                view_1.h('a', { attrs: {
                        href: 'https://kangax.github.io/compat-table/es6/',
                        target: '_blank',
                        rel: 'noopener noreferrer',
                    } }, 'ES Table'),
            ]),
            view_1.h('div', {
                class: { [style.codeEditor]: true },
                attrs: { id: 'codeEditor' },
            }),
        ]),
    ]);
};
exports.interfaces = { view };
const style = {
    base: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titlePrimary: {
        padding: '0 20px',
        marginBottom: '10px',
        fontSize: '70px',
        textAlign: 'center',
        color: constants_1.palette.primary,
    },
    container: {
        margin: '10px',
        width: '100%',
        height: 'calc(100% - 120px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontSize: '24px',
    },
    text: {
        marginBottom: '15px',
        padding: '10px 40px',
    },
    codeEditor: {
        width: 'calc(100% - 20px)',
        height: '340px',
    },
};
exports.groups = { style };
const exampleCode = `async function aPages () {
  let posts = await fetch('https://jsonplaceholder.typicode.com/posts')
    .then(res => res.text())
  let users = await fetch('https://jsonplaceholder.typicode.com/users')
    .then(res => res.text())
  return (posts + users).split('a').length - 1
}
aPages().then(n => console.log(\`Hay \${n} A's\`))
`;
//# sourceMappingURL=10.js.map
});
___scope___.file("Root/slides/11.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const view_1 = require("fractal-core/interfaces/view");
const constants_1 = require("../constants");
exports.name = '11';
exports.state = {};
exports.inputs = ({ stateOf, toAct }) => ({});
exports.actions = {};
const view = ({ ctx, ev, act }) => s => {
    let style = ctx.groups.style;
    return view_1.h('div', {
        key: ctx.name,
        class: { [style.base]: true },
    }, [
        view_1.h('div', { class: { [style.titlePrimary]: true } }, 'CSS Grid'),
    ]);
};
exports.interfaces = { view };
const style = {
    base: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titlePrimary: {
        padding: '0 20px',
        marginBottom: '10px',
        fontSize: '70px',
        textAlign: 'center',
        color: constants_1.palette.tertiary,
    },
};
exports.groups = { style };
//# sourceMappingURL=11.js.map
});
___scope___.file("Root/slides/12.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const view_1 = require("fractal-core/interfaces/view");
const constants_1 = require("../constants");
exports.name = '12';
exports.state = {};
exports.inputs = ctx => ({});
exports.actions = {};
const view = ({ ctx }) => s => {
    let style = ctx.groups.style;
    return view_1.h('div', {
        key: ctx.name,
        class: { [style.base]: true },
    }, [
        view_1.h('div', { class: { [style.titlePrimary]: true } }, 'Gracias!'),
        view_1.h('div', { class: { [style.titleSecondary]: true } }, [
            'Me encuentran como ',
            view_1.h('a', { attrs: {
                    href: 'https://github.com/carloslfu',
                    target: '_blank',
                    rel: 'noopener noreferer',
                } }, '@carloslfu'),
            ' en Github',
        ]),
        view_1.h('div', { class: { [style.titleSecondary]: true } }, 'Recursos:'),
        ...[
            ['Native apps are doomed - Eiric Elliot', 'https://medium.com/javascript-scene/native-apps-are-doomed-ac397148a2c0'],
            ['Offline Cookbook - Jake Archibald', 'https://jakearchibald.com/2014/offline-cookbook'],
            ['Emscripten', 'https://kripken.github.io/mloc_emscripten_talk'],
            ['ESNext Table', 'https://kangax.github.io/compat-table/es6/'],
        ].map(el => view_1.h('a', { attrs: {
                href: el[1],
                target: '_blank',
                rel: 'noopener noreferer',
            } }, el[0])),
    ]);
};
exports.interfaces = { view };
const style = {
    base: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titlePrimary: {
        padding: '0 20px',
        marginBottom: '50px',
        fontSize: '70px',
        textAlign: 'center',
        color: constants_1.palette.tertiary,
    },
    titleSecondary: {
        margin: '10px',
        fontSize: '34px',
        textAlign: 'center',
    },
};
exports.groups = { style };
//# sourceMappingURL=12.js.map
});
___scope___.file("hmr.js", function(exports, require, module, __filename, __dirname){
/* fuse:injection: */ var process = require("process");
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fractal_core_1 = require("fractal-core");
if (!process.env.isProduction) {
    const customizedHMRPlugin = {
        hmrUpdate: data => {
            if (data.type === 'js') {
                FuseBox.flush();
                FuseBox.dynamic(data.path, data.content);
                if (FuseBox.mainFile && data.path.slice(0, 4) === 'Root') {
                    let Root = FuseBox.import('./Root');
                    window.app.moduleAPI.reattach(Root, fractal_core_1.mergeStates);
                }
                else if (FuseBox.mainFile) {
                    ;
                    window.app.moduleAPI.dispose();
                    FuseBox.import(FuseBox.mainFile);
                }
                return true;
            }
        }
    };
    if (!process.env.hmrRegistered) {
        process.env.hmrRegistered = false;
        FuseBox.addPlugin(customizedHMRPlugin);
    }
}
//# sourceMappingURL=hmr.js.map
});
});
FuseBox.pkg("fusebox-hot-reload", {}, function(___scope___){
___scope___.file("index.js", function(exports, require, module, __filename, __dirname){

"use strict";
/**
 * @module listens to `source-changed` socket events and actions hot reload
 */
Object.defineProperty(exports, "__esModule", { value: true });
var Client = require('fusebox-websocket').SocketClient, bundleErrors = {}, outputElement = document.createElement('div'), styleElement = document.createElement('style'), minimizeToggleId = 'fuse-box-toggle-minimized', hideButtonId = 'fuse-box-hide', expandedOutputClass = 'fuse-box-expanded-output', localStoragePrefix = '__fuse-box_';
function storeSetting(key, value) {
    localStorage[localStoragePrefix + key] = value;
}
function getSetting(key) {
    return localStorage[localStoragePrefix + key] === 'true' ? true : false;
}
var outputInBody = false, outputMinimized = getSetting(minimizeToggleId), outputHidden = false;
outputElement.id = 'fuse-box-output';
styleElement.innerHTML = "\n    #" + outputElement.id + ", #" + outputElement.id + " * {\n        box-sizing: border-box;\n    }\n    #" + outputElement.id + " {\n        z-index: 999999999999;\n        position: fixed;\n        top: 10px;\n        right: 10px;\n        width: 400px;\n        overflow: auto;\n        background: #fdf3f1;\n        border: 1px solid #eca494;\n        border-radius: 5px;\n        font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif;\n        box-shadow: 0px 3px 6px 1px rgba(0,0,0,.15);\n    }\n    #" + outputElement.id + "." + expandedOutputClass + " {\n        height: auto;\n        width: auto;\n        left: 10px;\n        max-height: calc(100vh - 50px);\n    }\n    #" + outputElement.id + " .fuse-box-errors {\n        display: none;\n    }\n    #" + outputElement.id + "." + expandedOutputClass + " .fuse-box-errors {\n        display: block;\n        border-top: 1px solid #eca494;\n        padding: 0 10px;\n    }\n    #" + outputElement.id + " button {\n        border: 1px solid #eca494;\n        padding: 5px 10px;\n        border-radius: 4px;\n        margin-left: 5px;\n        background-color: white;\n        color: black;\n        box-shadow: 0px 2px 2px 0px rgba(0,0,0,.05);\n    }\n    #" + outputElement.id + " .fuse-box-header {\n        padding: 10px;\n    }\n    #" + outputElement.id + " .fuse-box-header h4 {\n        display: inline-block;\n        margin: 4px;\n    }";
styleElement.type = 'text/css';
document.getElementsByTagName('head')[0].appendChild(styleElement);
function displayBundleErrors() {
    var errorMessages = Object.keys(bundleErrors).reduce(function (allMessages, bundleName) {
        var bundleMessages = bundleErrors[bundleName];
        return allMessages.concat(bundleMessages.map(function (message) {
            var messageOutput = message
                .replace(/\n/g, '<br>')
                .replace(/\t/g, '&nbsp;&nbps;&npbs;&nbps;')
                .replace(/ /g, '&nbsp;');
            return "<pre>" + messageOutput + "</pre>";
        }));
    }, []), errorOutput = errorMessages.join('');
    if (errorOutput && !outputHidden) {
        outputElement.innerHTML = "\n        <div class=\"fuse-box-header\" style=\"\">\n            <h4 style=\"\">Fuse Box Bundle Errors (" + errorMessages.length + "):</h4>\n            <div style=\"float: right;\">\n                <button id=\"" + minimizeToggleId + "\">" + (outputMinimized ? 'Expand' : 'Minimize') + "</button>\n                <button id=\"" + hideButtonId + "\">Hide</button>\n            </div>\n        </div>\n        <div class=\"fuse-box-errors\">\n            " + errorOutput + "\n        </div>\n        ";
        document.body.appendChild(outputElement);
        outputElement.className = outputMinimized ? '' : expandedOutputClass;
        outputInBody = true;
        document.getElementById(minimizeToggleId).onclick = function () {
            outputMinimized = !outputMinimized;
            storeSetting(minimizeToggleId, outputMinimized);
            displayBundleErrors();
        };
        document.getElementById(hideButtonId).onclick = function () {
            outputHidden = true;
            displayBundleErrors();
        };
    }
    else if (outputInBody) {
        document.body.removeChild(outputElement);
        outputInBody = false;
    }
}
exports.connect = function (port, uri) {
    if (FuseBox.isServer) {
        return;
    }
    port = port || window.location.port;
    var client = new Client({
        port: port,
        uri: uri,
    });
    client.connect();
    client.on('source-changed', function (data) {
        console.info("%cupdate \"" + data.path + "\"", 'color: #237abe');
        /**
         * If a plugin handles this request then we don't have to do anything
         **/
        for (var index = 0; index < FuseBox.plugins.length; index++) {
            var plugin = FuseBox.plugins[index];
            if (plugin.hmrUpdate && plugin.hmrUpdate(data)) {
                return;
            }
        }
        if (data.type === "hosted-css") {
            var fileId = data.path.replace(/^\//, '').replace(/[\.\/]+/g, '-');
            var existing = document.getElementById(fileId);
            if (existing) {
                existing.setAttribute("href", data.path + "?" + new Date().getTime());
            }
            else {
                var node = document.createElement('link');
                node.id = fileId;
                node.type = 'text/css';
                node.rel = 'stylesheet';
                node.href = data.path;
                document.getElementsByTagName('head')[0].appendChild(node);
            }
        }
        if (data.type === 'js' || data.type === "css") {
            FuseBox.flush();
            FuseBox.dynamic(data.path, data.content);
            if (FuseBox.mainFile) {
                try {
                    FuseBox.import(FuseBox.mainFile);
                }
                catch (e) {
                    if (typeof e === 'string') {
                        if (/not found/.test(e)) {
                            return window.location.reload();
                        }
                    }
                    console.error(e);
                }
            }
        }
    });
    client.on('error', function (error) {
        console.log(error);
    });
    client.on('bundle-error', function (_a) {
        var bundleName = _a.bundleName, message = _a.message;
        console.error("Bundle error in " + bundleName + ": " + message);
        var errorsForBundle = bundleErrors[bundleName] || [];
        errorsForBundle.push(message);
        bundleErrors[bundleName] = errorsForBundle;
        displayBundleErrors();
    });
    client.on('update-bundle-errors', function (_a) {
        var bundleName = _a.bundleName, messages = _a.messages;
        messages.forEach(function (message) { return console.error("Bundle error in " + bundleName + ": " + message); });
        bundleErrors[bundleName] = messages;
        displayBundleErrors();
    });
};

});
return ___scope___.entry = "index.js";
});
FuseBox.pkg("fusebox-websocket", {}, function(___scope___){
___scope___.file("index.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var events = require('events');
var SocketClient = /** @class */ (function () {
    function SocketClient(opts) {
        opts = opts || {};
        var port = opts.port || window.location.port;
        var protocol = location.protocol === 'https:' ? 'wss://' : 'ws://';
        var domain = location.hostname || 'localhost';
        this.url = opts.host || "" + protocol + domain + ":" + port;
        if (opts.uri) {
            this.url = opts.uri;
        }
        this.authSent = false;
        this.emitter = new events.EventEmitter();
    }
    SocketClient.prototype.reconnect = function (fn) {
        var _this = this;
        setTimeout(function () {
            _this.emitter.emit('reconnect', { message: 'Trying to reconnect' });
            _this.connect(fn);
        }, 5000);
    };
    SocketClient.prototype.on = function (event, fn) {
        this.emitter.on(event, fn);
    };
    SocketClient.prototype.connect = function (fn) {
        var _this = this;
        console.log('%cConnecting to fusebox HMR at ' + this.url, 'color: #237abe');
        setTimeout(function () {
            _this.client = new WebSocket(_this.url);
            _this.bindEvents(fn);
        }, 0);
    };
    SocketClient.prototype.close = function () {
        this.client.close();
    };
    SocketClient.prototype.send = function (eventName, data) {
        if (this.client.readyState === 1) {
            this.client.send(JSON.stringify({ event: eventName, data: data || {} }));
        }
    };
    SocketClient.prototype.error = function (data) {
        this.emitter.emit('error', data);
    };
    /** Wires up the socket client messages to be emitted on our event emitter */
    SocketClient.prototype.bindEvents = function (fn) {
        var _this = this;
        this.client.onopen = function (event) {
            console.log('%cConnected', 'color: #237abe');
            if (fn) {
                fn(_this);
            }
        };
        this.client.onerror = function (event) {
            _this.error({ reason: event.reason, message: 'Socket error' });
        };
        this.client.onclose = function (event) {
            _this.emitter.emit('close', { message: 'Socket closed' });
            if (event.code !== 1011) {
                _this.reconnect(fn);
            }
        };
        this.client.onmessage = function (event) {
            var data = event.data;
            if (data) {
                var item = JSON.parse(data);
                _this.emitter.emit(item.type, item.data);
                _this.emitter.emit('*', item);
            }
        };
    };
    return SocketClient;
}());
exports.SocketClient = SocketClient;

});
return ___scope___.entry = "index.js";
});
FuseBox.pkg("events", {}, function(___scope___){
___scope___.file("index.js", function(exports, require, module, __filename, __dirname){

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
if (FuseBox.isServer) {
    module.exports = global.require("events");
} else {
    function EventEmitter() {
        this._events = this._events || {};
        this._maxListeners = this._maxListeners || undefined;
    }
    module.exports = EventEmitter;

    // Backwards-compat with node 0.10.x
    EventEmitter.EventEmitter = EventEmitter;

    EventEmitter.prototype._events = undefined;
    EventEmitter.prototype._maxListeners = undefined;

    // By default EventEmitters will print a warning if more than 10 listeners are
    // added to it. This is a useful default which helps finding memory leaks.
    EventEmitter.defaultMaxListeners = 10;

    // Obviously not all Emitters should be limited to 10. This function allows
    // that to be increased. Set to zero for unlimited.
    EventEmitter.prototype.setMaxListeners = function(n) {
        if (!isNumber(n) || n < 0 || isNaN(n))
            throw TypeError("n must be a positive number");
        this._maxListeners = n;
        return this;
    };

    EventEmitter.prototype.emit = function(type) {
        var er, handler, len, args, i, listeners;

        if (!this._events)
            this._events = {};

        // If there is no 'error' event listener then throw.
        if (type === "error") {
            if (!this._events.error ||
                (isObject(this._events.error) && !this._events.error.length)) {
                er = arguments[1];
                if (er instanceof Error) {
                    throw er; // Unhandled 'error' event
                }
                throw TypeError("Uncaught, unspecified \"error\" event.");
            }
        }

        handler = this._events[type];

        if (isUndefined(handler))
            return false;

        if (isFunction(handler)) {
            switch (arguments.length) {
                // fast cases
                case 1:
                    handler.call(this);
                    break;
                case 2:
                    handler.call(this, arguments[1]);
                    break;
                case 3:
                    handler.call(this, arguments[1], arguments[2]);
                    break;
                    // slower
                default:
                    args = Array.prototype.slice.call(arguments, 1);
                    handler.apply(this, args);
            }
        } else if (isObject(handler)) {
            args = Array.prototype.slice.call(arguments, 1);
            listeners = handler.slice();
            len = listeners.length;
            for (i = 0; i < len; i++)
                listeners[i].apply(this, args);
        }

        return true;
    };

    EventEmitter.prototype.addListener = function(type, listener) {
        var m;

        if (!isFunction(listener))
            throw TypeError("listener must be a function");

        if (!this._events)
            this._events = {};

        // To avoid recursion in the case that type === "newListener"! Before
        // adding it to the listeners, first emit "newListener".
        if (this._events.newListener)
            this.emit("newListener", type,
                isFunction(listener.listener) ?
                listener.listener : listener);

        if (!this._events[type])
        // Optimize the case of one listener. Don't need the extra array object.
            this._events[type] = listener;
        else if (isObject(this._events[type]))
        // If we've already got an array, just append.
            this._events[type].push(listener);
        else
        // Adding the second element, need to change to array.
            this._events[type] = [this._events[type], listener];

        // Check for listener leak
        if (isObject(this._events[type]) && !this._events[type].warned) {
            if (!isUndefined(this._maxListeners)) {
                m = this._maxListeners;
            } else {
                m = EventEmitter.defaultMaxListeners;
            }

            if (m && m > 0 && this._events[type].length > m) {
                this._events[type].warned = true;
                console.error("(node) warning: possible EventEmitter memory " +
                    "leak detected. %d listeners added. " +
                    "Use emitter.setMaxListeners() to increase limit.",
                    this._events[type].length);
                if (typeof console.trace === "function") {
                    // not supported in IE 10
                    console.trace();
                }
            }
        }

        return this;
    };

    EventEmitter.prototype.on = EventEmitter.prototype.addListener;

    EventEmitter.prototype.once = function(type, listener) {
        if (!isFunction(listener))
            throw TypeError("listener must be a function");

        var fired = false;

        function g() {
            this.removeListener(type, g);

            if (!fired) {
                fired = true;
                listener.apply(this, arguments);
            }
        }

        g.listener = listener;
        this.on(type, g);

        return this;
    };

    // emits a 'removeListener' event iff the listener was removed
    EventEmitter.prototype.removeListener = function(type, listener) {
        var list, position, length, i;

        if (!isFunction(listener))
            throw TypeError("listener must be a function");

        if (!this._events || !this._events[type])
            return this;

        list = this._events[type];
        length = list.length;
        position = -1;

        if (list === listener ||
            (isFunction(list.listener) && list.listener === listener)) {
            delete this._events[type];
            if (this._events.removeListener)
                this.emit("removeListener", type, listener);

        } else if (isObject(list)) {
            for (i = length; i-- > 0;) {
                if (list[i] === listener ||
                    (list[i].listener && list[i].listener === listener)) {
                    position = i;
                    break;
                }
            }

            if (position < 0)
                return this;

            if (list.length === 1) {
                list.length = 0;
                delete this._events[type];
            } else {
                list.splice(position, 1);
            }

            if (this._events.removeListener)
                this.emit("removeListener", type, listener);
        }

        return this;
    };

    EventEmitter.prototype.removeAllListeners = function(type) {
        var key, listeners;

        if (!this._events)
            return this;

        // not listening for removeListener, no need to emit
        if (!this._events.removeListener) {
            if (arguments.length === 0)
                this._events = {};
            else if (this._events[type])
                delete this._events[type];
            return this;
        }

        // emit removeListener for all listeners on all events
        if (arguments.length === 0) {
            for (key in this._events) {
                if (key === "removeListener") continue;
                this.removeAllListeners(key);
            }
            this.removeAllListeners("removeListener");
            this._events = {};
            return this;
        }

        listeners = this._events[type];

        if (isFunction(listeners)) {
            this.removeListener(type, listeners);
        } else if (listeners) {
            // LIFO order
            while (listeners.length)
                this.removeListener(type, listeners[listeners.length - 1]);
        }
        delete this._events[type];

        return this;
    };

    EventEmitter.prototype.listeners = function(type) {
        var ret;
        if (!this._events || !this._events[type])
            ret = [];
        else if (isFunction(this._events[type]))
            ret = [this._events[type]];
        else
            ret = this._events[type].slice();
        return ret;
    };

    EventEmitter.prototype.listenerCount = function(type) {
        if (this._events) {
            var evlistener = this._events[type];

            if (isFunction(evlistener))
                return 1;
            else if (evlistener)
                return evlistener.length;
        }
        return 0;
    };

    EventEmitter.listenerCount = function(emitter, type) {
        return emitter.listenerCount(type);
    };

    function isFunction(arg) {
        return typeof arg === "function";
    }

    function isNumber(arg) {
        return typeof arg === "number";
    }

    function isObject(arg) {
        return typeof arg === "object" && arg !== null;
    }

    function isUndefined(arg) {
        return arg === void 0;
    }
}

});
return ___scope___.entry = "index.js";
});
FuseBox.import("fusebox-hot-reload").connect(3000, "")
FuseBox.target = "universal"

FuseBox.import("default/index.js");
FuseBox.main("default/index.js");
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
//# sourceMappingURL=app.js.map