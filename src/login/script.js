import { createApp } from 'vue'

import App from './Login'
import storage from '../utils/storage'
import { redirectCurrentTab } from '../src_jq/common/commonFunctions'

storage.get('app-uuid')
  .then((value) => {
    if (!value) {
      const app = createApp(App)

      app.mount('#app')
    } else {
      redirectCurrentTab('/cheatsheets/page.html')
    }
  })
