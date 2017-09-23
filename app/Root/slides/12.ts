import {
  Actions,
  Inputs,
  Interfaces,
  StyleGroup,
} from 'fractal-core'
import { View, h } from 'fractal-core/interfaces/view'
import { palette } from '../constants'

export const name = '12'

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
    h('div', {class: { [style.titlePrimary]: true }}, 'Gracias!'),
    h('div', {class: { [style.titleSecondary]: true }}, [
      <any> 'Me encuentran como ',
      h('a', {attrs: {
        href: 'https://github.com/carloslfu',
        target: '_blank',
        rel: 'noopener noreferer',
      }}, '@carloslfu'),
      <any>' en Github',
    ]),
    h('div', {class: { [style.titleSecondary]: true }}, 'Recursos:'),
    ...[
      ['Native apps are doomed - Eiric Elliot', 'https://medium.com/javascript-scene/native-apps-are-doomed-ac397148a2c0'],
      ['Offline Cookbook - Jake Archibald', 'https://jakearchibald.com/2014/offline-cookbook'],
      ['Emscripten', 'https://kripken.github.io/mloc_emscripten_talk'],
      ['ESNext Table', 'https://kangax.github.io/compat-table/es6/'],
    ].map(el => h('a', {attrs: {
      href: el[1],
      target: '_blank',
      rel: 'noopener noreferer',
    }}, el[0])),
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
    marginBottom: '50px',
    fontSize: '70px',
    textAlign: 'center',
    color: palette.tertiary,
  },
  titleSecondary: {
    margin: '10px',
    fontSize: '34px',
    textAlign: 'center',
  },
}

export const groups = { style }

