import {
  Actions,
  Inputs,
  Interfaces,
  StyleGroup,
  assoc,
  Components,
} from 'fractal-core'
import { View, h } from 'fractal-core/interfaces/view'
import { waitMS, launchIntoFullscreen, exitFullscreen, isDecendantOfId } from '../utils'
import { palette } from './constants'

import slides from './slides'

const numSlides = Object.keys(slides).length

export const name = 'Root'

export const components: Components = slides

export const state = {
  step: <'visible' | 'hiddenLeft' | 'hiddenRight'> 'visible',
  slide: 0,
  animated: false,
  fullscreen: false,
}

export type S = typeof state

export const inputs: Inputs<S> = ({ toAct, stateOf, toIt, toChild }) => ({
  init: async () => {
    let hash = window.location.hash || '#0'
    if (hash) {
      let slide = parseInt(hash.substr(1))
      toAct('SetSlide', slide)
      toChild(slide + '', 'init')
    }
    window.addEventListener('hashchange', () => {
      let slide = parseInt((window.location.hash || '#0').substr(1))
      toAct('SetSlide', slide)
      setTimeout(() => toChild(slide + '', 'init'), 500)
    })
    window.addEventListener('keyup', ev => {
      if (isDecendantOfId(ev.target, 'codeEditor') || isDecendantOfId(ev.target, 'testEditor')) {
        return
      }
      if (ev.keyCode === 39) {
        toIt('slide', 'NextSlide')
      } else if (ev.keyCode === 37) {
        toIt('slide', 'PrevSlide')
      }
    })
  },
  slide: async (action: string) => {
    await toAct('SetAnimated', true)
    await toAct('SetStep', action === 'NextSlide' ? 'hiddenLeft' : 'hiddenRight')
    await waitMS(300)
    let initialSlide = stateOf().slide
    await toAct(action)
    let slide = stateOf().slide
    if (slide === initialSlide) {
      await toAct('SetStep', 'visible')
      return
    }
    await toIt('setHash', slide)
    await toAct('SetAnimated', false)
    await toAct('SetStep', action === 'NextSlide' ? 'hiddenRight' : 'hiddenLeft')
    await waitMS(100)
    await toAct('SetAnimated', true)
    await toChild(slide + '', 'init')
    await toAct('SetStep', 'visible')
  },
  setHash: (hash: string) => {
    history.pushState(null, null, document.location.pathname + '#' + hash)
  },
  toggleFullScreen: async () => {
    if (stateOf().fullscreen) {
      exitFullscreen()
    } else {
      launchIntoFullscreen(document.documentElement)
    }
    await toAct('ToggleFullscreen')
  },
})

export const actions: Actions<S> = {
  ToggleFullscreen: () => s => {
    s.fullscreen = !s.fullscreen
    return s
  },
  SetStep: assoc('step'),
  SetSlide: assoc('slide'),
  SetAnimated: assoc('animated'),
  NextSlide: () => s => {
    if (s.slide < numSlides - 1) {
      s.slide++
    }
    return s
  },
  PrevSlide: () => s => {
    if (s.slide > 0) {
      s.slide--
    }
    return s
  },
}

const view: View<S> = ({ ctx, ev, vw, act }) => s => {
  let style = ctx.groups.style

  return h('div', {
    key: ctx.name,
    class: { [style.base]: true },
  }, [
    h('div', {class: {
      [style.slide]: true,
      [style.slideVisible]: s.step === 'visible',
      [style.slideAnimated]: s.animated,
      [style.slideHiddenLeft]: s.step === 'hiddenLeft',
      [style.slideHiddenRight]: s.step === 'hiddenRight',
    }}, [
      h('div', {class: { [style.buttonContainer]: true }}, [
        h('button', {
          class: { [style.button]: true, [style.buttonDisabled]: s.slide === 0 },
          on: { click: ev('slide', 'PrevSlide') },
          attrs: s.slide === 0 ? { disabled: 'disabled' } : {},
        }, '<'),
        h('button', {
          class: { [style.button]: true },
          on: { click: ev('toggleFullScreen') },
        }, s.fullscreen ? 'X' : 'O'),
        h('button', {
          class: { [style.button]: true, [style.buttonDisabled]: s.slide === numSlides - 1 },
          on: { click: ev('slide', 'NextSlide') },
          attrs: s.slide === numSlides - 1 ? { disabled: 'disabled' } : {},
        }, '>'),
      ]),
      vw(s.slide + ''),
    ]),
  ])
}

export const interfaces: Interfaces = { view }

const style: StyleGroup = {
  base: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    fontFamily: '"Open Sans", sans-serif',
    color: palette.textPrimary,
    overflow: 'hidden',
  },
  slide: {
    width: '800px',
    height: '92%',
    borderRadius: '40px',
    backgroundColor: 'white',
    opacity: 0,
    boxShadow: '1px 1px 2px 1px #656565',
  },
  slideVisible: {
    opacity: 1,
    transform: 'translateX(0px)',
  },
  slideAnimated: {
    transition: 'transform .4s, opacity .4s',
  },
  slideHiddenLeft: {
    opacity: 0,
    transform: 'translateX(-200px)',
  },
  slideHiddenRight: {
    opacity: 0,
    transform: 'translateX(200px)',
  },
  buttonContainer: {
    position: 'absolute',
    right: '25px',
    bottom: '12px',
  },
  button: {
    margin: '2px',
    width: '30px',
    height: '30px',
    borderRadius: '7px',
    cursor: 'pointer',
    outline: 'none',
    border: 'none',
    fontSize: '20px',
    color: palette.textSecondary,
    backgroundColor: 'white',
    $nest: {
      '&:hover': {
        backgroundColor: palette.greyLight,
      },
    },
  },
  buttonDisabled: {
    color: palette.grey,
    cursor: 'not-allowed',
  },
}

export const groups = { style }
