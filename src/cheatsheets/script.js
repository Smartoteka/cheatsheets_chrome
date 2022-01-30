// eslint-disable-next-line import/no-unresolved
import 'windi.css'
import './styles.scss'
import 'element-plus/dist/index.css'

import { createApp } from 'vue'

import ElementPlus from 'element-plus'
import VueFeather from 'vue-feather'

import ContextMenu from '../common/vue3-context-menu/vue3-context-menu.umd.min'
import App from './cheatscheets'
import storage from '../utils/storage'
import { redirectCurrentTab, truncate } from '../src_jq/common/commonFunctions'
import '../common/vue3-context-menu/vue3-context-menu.css'

const app = createApp(App, { popup: false })

app.config.globalProperties.$filters = {
  truncate: truncate,
}

app.use(ElementPlus)
app.use(ContextMenu)

app.component(VueFeather.name, VueFeather)

app.mount('#app')

// storage.get('app-uuid')
//   .then((value) => {
//     if (!value) { redirectCurrentTab('/login/page.html') }
//   })
