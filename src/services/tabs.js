import browser from 'webextension-polyfill'

export default {
  async getWindows() {
    const windows = await browser.windows.getAll({ populate: true })
    return windows
  },

  async activateTab(id) {
    browser.tabs.update(id, { active: true })
  },

  async activateWindow(id) {
    browser.windows.update(id, { focused: true })
  },

  async minimizeWindow(id) {
    browser.windows.update(id, { state: 'minimized' })
  },

  async drawAttention(id) {
    browser.windows.update(id, { drawAttention: true })
  },

  async closeTab(id) {
    browser.tabs.remove(id)
  },

}

// chrome.windows.getAll({ populate: true }, function (window) {
//   window.forEach(function (window) {
//     window.tabs.forEach(function (tab) {
//       // collect all of the urls here, I will just log them instead
//       console.log(tab.url)
//     })
//   })
// })
