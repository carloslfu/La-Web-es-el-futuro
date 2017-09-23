import {
  Actions,
  Inputs,
  Interfaces,
  StyleGroup,
} from 'fractal-core'
import { View, h } from 'fractal-core/interfaces/view'
import { palette } from '../constants'

declare const monaco: any

export const name = '10'

export const state = {
  fnString: '',
  result: '',
}

export type S = typeof state

let monacoLoaded = false
let codeEditor

export const inputs: Inputs<S> = ({ stateOf, toAct }) => ({
  init: () => {
    let loadEditor = () => {
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
      })
      codeEditor = monaco.editor.create(document.getElementById('codeEditor'), {
        value: exampleCode,
        language: 'javascript'
      })
      monacoLoaded = true
    }
    if ((window as any).monacoLoaded) {
      loadEditor()
    } else {
      ;(window as any).onMonacoLoaded = loadEditor
    }
  },
})

export const actions: Actions<S> = {}

const view: View<S> = ({ ctx, ev, act }) => s => {
  let style = ctx.groups.style

  return h('div', {
    key: ctx.name,
    class: { [style.base]: true },
  }, [
    h('div', {class: { [style.titlePrimary]: true }}, 'Si! esto ya está disponible en la Web'),
    h('div', {class: { [style.container]: true }}, [
      h('div', {class: { [style.text]: true }}, [
        <any> 'Funciones asíncronas, arrow functions, let, const, template strings, rest / spread, destructuring, etc … ',
        h('a', {attrs: {
          href: 'https://kangax.github.io/compat-table/es6/',
          target: '_blank',
          rel: 'noopener noreferrer',
        }}, 'ES Table'),
      ]),
      h('div', {
        class: { [style.codeEditor]: true },
        attrs: { id: 'codeEditor' },
      }),
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
  text: {
    marginBottom: '15px',
    padding: '10px 40px',
  },
  codeEditor: {
    width: 'calc(100% - 20px)',
    height: '340px',
  },
}

export const groups = { style }

const exampleCode = `async function aPages () {
  let posts = await fetch('https://jsonplaceholder.typicode.com/posts')
    .then(res => res.text())
  let users = await fetch('https://jsonplaceholder.typicode.com/users')
    .then(res => res.text())
  return (posts + users).split('a').length - 1
}
aPages().then(n => console.log(\`Hay \${n} A's\`))
`
