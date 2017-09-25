import {
  Actions,
  Inputs,
  Interfaces,
  StyleGroup,
} from 'fractal-core'
import { View, h } from 'fractal-core/interfaces/view'
import { palette } from '../constants'

export const name = '5'

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
    h('div', {class: { [style.titlePrimary]: true }}, 'Servo al rescate'),
    h('ul', {class: { [style.list]: true }}, [
      h('li', {}, 'Proyecto conjunto de Mozilla, Samsung y otras empresas'),
      h('li', {}, 'Un motor de renderizado muy rápido, masivamente paralelo e implementado en Rust'),
      h('li', {}, 'Rust es un lenguaje diseñado con los requerimientos de Servo en mente'),
      h('li', {}, 'Quantum (Motor de CSS de Servo) actualmente en estado experimental en Firefox. Hito comparado con “reemplazar partes de un avión mientras vuela”.'),
      h('li', {}, 'Run Servo run!'),
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
    color: palette.secondary,
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
