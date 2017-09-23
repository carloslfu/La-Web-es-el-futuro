import {
  Actions,
  Inputs,
  Interfaces,
  StyleGroup,
  assoc,
} from 'fractal-core'
import { View, h } from 'fractal-core/interfaces/view'
import { palette } from '../constants'
import { compileModule, c as _c, factorialCode } from '../scripts'

declare const monaco: any

export const name = '9'

export const state = {
  fnString: '',
  result: '',
}

export type S = typeof state

let _fn: any = {}

let monacoLoaded = false
let codeEditor
let testEditor

export const inputs: Inputs<S> = ({ stateOf, toAct }) => ({
  init: () => {
    let loadEditor = () => {
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
      })
      codeEditor = monaco.editor.create(document.getElementById('codeEditor'), {
        value: factorialCode,
        language: 'javascript'
      })
      testEditor = monaco.editor.create(document.getElementById('testEditor'), {
        value: 'fn(5)',
        language: 'javascript',
      })
      monacoLoaded = true
    }
    if ((window as any).monacoLoaded) {
      loadEditor()
    } else {
      ;(window as any).onMonacoLoaded = loadEditor
    }
  },
  compile: async () => {
    let mod
    let c = _c
    eval('mod = ' + codeEditor.getValue())
    try {
      compileModule(mod).then(ex => {
        _fn.run = ex.fn
        console.log(_fn.run)
        toAct('SetFnString', _fn.run.toString())
      })
    } catch (err) {}
  },
  runTest: async () => {
    let s: S = stateOf()
    let testCode = testEditor.getValue()
    if (!testCode) {
      return
    }
    let res
    let fn = _fn.run
    eval('res = ' + testCode)
    await toAct('SetResult', res)
  },
})

export const actions: Actions<S> = {
  SetFnString: assoc('fnString'),
  SetResult: assoc('result'),
}

const view: View<S> = ({ ctx, ev, act }) => s => {
  let style = ctx.groups.style

  return h('div', {
    key: ctx.name,
    class: { [style.base]: true },
  }, [
    h('div', {class: { [style.titlePrimary]: true }}, 'Time to WASM!'),
    h('div', {class: { [style.container]: true }}, [
      h('div', {
        class: { [style.codeEditor]: true },
        attrs: { id: 'codeEditor' },
      }),
      h('div', {class: { [style.resContainer]: true }}, [
        h('div', {
          class: { [style.btn]: true },
          on: { click: ev('compile') },
        }, 'Compilar'),
        h('div', {class: { [style.result]: true }}, s.fnString ? s.fnString : 'Sin Compilar'),
      ]),
      h('div', {
        class: { [style.testEditor]: true },
        attrs: { id: 'testEditor' },
      }),
      h('div', {class: { [style.resContainer]: true }}, [
        h('div', {
          class: { [style.btn]: true },
          on: { click: ev('runTest') },
        }, 'Ejecutar!'),
        h('div', {class: { [style.result]: true }}, s.result),
      ]),
    ]),
  ])
}

export const interfaces: Interfaces = { view }

const style: StyleGroup = {
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
    color: palette.primary,
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
    color: palette.textSecondary,
    cursor: 'pointer',
    $nest: {
      '&:hover': {
        backgroundColor: palette.greyLight,
      },
    },
  },
  result: {
    marginLeft: '20px',
    borderBottom: '1px solid ' + palette.greyLight,
  },
}

export const groups = { style }
