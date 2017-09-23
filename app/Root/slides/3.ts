import {
  Actions,
  Inputs,
  Interfaces,
  StyleGroup,
} from 'fractal-core'
import { View, h } from 'fractal-core/interfaces/view'
import { palette } from '../constants'

export const name = '2'

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
    h('div', {class: { [style.titlePrimary]: true }}, 'El poder de la Web y las PWAs'),
    h('ul', {class: { [style.list]: true }}, [
      h('li', {
        class: { [style.item]: true },
      }, 'Interacción instantánea (No requiere instalación) - Android libero InstantApps'),
      h('li', {
        class: { [style.item]: true },
      }, [
        <any> 'Trabajo offline via Service Worker API: cache, background-sync … etc, ',
        h('a', {attrs: {
          href: 'https://jakearchibald.com/2014/offline-cookbook/',
          target: '_blank',
          rel: 'noopener noreferrer',
        } }, 'Jake Archibald offline cookbook'),
      ]),
      h('li', {}, 'Aplicaciones bajo demanda (Buscadores Web)'),
      h('li', {}, 'Funcionalidad bajo demanda: Code Splitting'),
      h('li', {}, 'Esta presentación está disponible offline :) (ejemplo)'),
      h('li', {}, [
        h('a', {attrs: {
          href: 'https://hnpwa.com',
          target: '_blank',
          rel: 'noopener noreferrer',
        } }, 'Hacker News PWAs'),
      ]),
    ]),
  ])
}

export const interfaces: Interfaces = { view }

const style: StyleGroup = {
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
    color: palette.tertiary,
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
