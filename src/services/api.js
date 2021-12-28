import axios from './axios'

export default {
  async login(login, email) {
    const { id } = chrome.runtime
    const { version } = chrome.runtime.getManifest()
    const { data } = await axios.put('/main', {
      email: email,
      login: login,
      extId: id,
      version: version,
    })

    return data
  },

  async register(login, email) {
    const { id } = chrome.runtime
    const { version } = chrome.runtime.getManifest()
    const { data } = await axios.post('/main', {
      email,
      login,
      extId: id,
      version,
    })

    return data
  },
}
