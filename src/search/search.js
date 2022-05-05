// eslint-disable-next-line import/no-unresolved
import 'windi.css'
import './search.scss'
import 'element-plus/dist/index.css'

import { createApp } from 'vue'

import App from '../cheatsheets/searchOnPage'
import '../common/vue3-context-menu/vue3-context-menu.css'

const app = createApp(App, { popup: true })

app.mount('#app')
