import {
  Actions,
  Inputs,
  Interfaces,
  StyleGroup,
} from 'fractal-core'
import { View, h } from 'fractal-core/interfaces/view'
import { palette } from '../constants'

export const name = '0'

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
    h('div', {class: { [style.titlePrimary]: true }}, 'La Web es el futuro'),
    h('div', {class: { [style.titleSecondary]: true }}, '¿Las aplicaciones nativas están condenadas?'),
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
    marginBottom: '30px',
    fontSize: '70px',
    textAlign: 'center',
    color: palette.primary,
  },
  titleSecondary: {
    paddingBottom: '40px',
    fontSize: '50px',
    textAlign: 'center',
  },
}

export const groups = { style }
