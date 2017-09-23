import {
  Actions,
  Inputs,
  Interfaces,
  StyleGroup,
} from 'fractal-core'
import { View, h } from 'fractal-core/interfaces/view'
import { palette } from '../constants'

export const name = '11'

export const state = {}

export type S = typeof state

export const inputs: Inputs<S> = ({ stateOf, toAct }) => ({
})

export const actions: Actions<S> = {}

const view: View<S> = ({ ctx, ev, act }) => s => {
  let style = ctx.groups.style

  return h('div', {
    key: ctx.name,
    class: { [style.base]: true },
  }, [
    h('div', {class: { [style.titlePrimary]: true }}, 'CSS Grid'),
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
    color: palette.tertiary,
  },
}

export const groups = { style }
