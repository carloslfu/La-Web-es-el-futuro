import {
  Actions,
  Inputs,
  Interfaces,
  StyleGroup,
} from 'fractal-core'
import { View, h } from 'fractal-core/interfaces/view'
import { palette } from '../constants'

export const name = 'Root'

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
    h('div', {class: { [style.titlePrimary]: true }}, 'La Web es fascinante!'),
    h('div', {class: { [style.titleSecondary]: true }}, 'Abierta / Multiplataforma / Potente'),
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
