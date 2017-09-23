import {
  Actions,
  Inputs,
  Interfaces,
  StyleGroup,
} from 'fractal-core'
import { View, h } from 'fractal-core/interfaces/view'
import { palette } from '../constants'

export const name = '4'

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
    h('div', {class: { [style.titlePrimary]: true }}, 'Desventajas'),
    h('ul', {class: { [style.list]: true }}, [
      h('li', {}, 'iOS no soporta SWs (se puede usar el meta tag), máximo en 5 años será implementado'),
      h('li', {}, 'Las aplicaciones Web son mucho más lentas que las nativas … por ahora … ;)'),
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
    marginBottom: '50px',
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
