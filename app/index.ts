import './assets/icons-bundle.css'
import './styles.css'
import { runModule } from './module'
import * as root from './Root'
import './hmr'

// navigator.serviceWorker.register('service-worker.js')

let DEV = !process.env.isProduction

;(async () => {
  let app = await runModule(root, DEV)
  ;(window as any).app = app
  app.moduleAPI.dispatch(['Root', 'init'])
})()
