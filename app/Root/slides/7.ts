import {
  Actions,
  Inputs,
  Interfaces,
  StyleGroup,
} from 'fractal-core'
import { View, h } from 'fractal-core/interfaces/view'
import { palette } from '../constants'

export const name = '7'

export const state = {}

export type S = typeof state

export const inputs: Inputs<S> = ctx => ({
})

export const actions: Actions<S> = {
}

const view: View<S> = ({ ctx }) => s => {
  let style = ctx.groups.style

  return h('div', {
    key: ctx.name,
    class: { [style.base]: true },
  }, [
    h('div', {class: { [style.titlePrimary]: true }}, 'WebAssembly FTW'),
    h('ul', {class: { [style.list]: true }}, [
      h('li', {}, 'Formato portable, eficiente en tamaño y tiempo de carga, conveniente para compilar en la Web. Un formato binario multiplataforma :O'),
      h('li', {}, 'Puedes compilar codigo C++ en WASM vía Emscripten, codigo C++ corriendo en el navegador!'),
      h('li', {}, 'Unreal Engine 3 fue portado en 4 días a ASM.js (precursor de WASM) usando Emscripten:'),
      h('li', {}, 'Velocidad comparable a la nativa: 50-67% y mejorando'),
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
  list: {
    margin: '10px',
    fontSize: '24px',
    $nest: {
      'li': {
        margin: '10px',
      },
    },
  },
}

export const groups = { style }
