import browser from 'webextension-polyfill'

export default {
  async search(text) {
    const history = await browser.history.search({ text })
    return history
  },
}
