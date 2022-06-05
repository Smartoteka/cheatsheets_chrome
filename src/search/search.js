// eslint-disable-next-line import/no-unresolved
import 'windi.css'
import './search.scss'
import 'element-plus/dist/index.css'

import { createApp } from 'vue'

import App from '../cheatsheets/searchOnPage'
import '../common/vue3-context-menu/vue3-context-menu.css'
import { redirectCurrentTab, truncate } from '../src_jq/common/commonFunctions'

const app = createApp(App, { popup: true })

app.config.globalProperties.$filters = {
  truncate: truncate,
}

app.mount('#app')
