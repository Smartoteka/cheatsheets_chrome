// eslint-disable-next-line import/no-unresolved
import 'windi.css'
import './popup.scss'
import 'element-plus/dist/index.css'

import { createApp } from 'vue'

import ContextMenu from '../common/vue3-context-menu/vue3-context-menu.umd.min'
import storage from '../utils/storage'
import { redirectCurrentTab, truncate } from '../src_jq/common/commonFunctions'

import App from '../cheatsheets/cheatscheets'
import '../common/vue3-context-menu/vue3-context-menu.css'

const app = createApp(App, { popup: true })

app.config.globalProperties.$filters = {
  truncate: truncate,
}

app.use(ContextMenu)

app.mount('#app')

// storage.get('app-uuid')
//   .then((value) => {
//     if (!value) { redirectCurrentTab('/login/page.html') }
//   })
