import storage from '../utils/storage'
import { getActiveTab } from '../src_jq/common/commonFunctions'

let currentPopupId = null

async function getOrCreatePopup(activeTab, url, width, height, isAddMode) {
  let createWindowCallback = async (openedWindow) => {
    currentPopupId = openedWindow.id
  }

  let create = (top) => chrome.windows.create(
    {
      url: chrome.runtime.getURL(url) + '?cmd=' + (isAddMode ? 'to-add' : 'clear'),
      type: 'popup',
      focused: true,
      height: height,
      width: width,
      top: top,
      left: screen.width - width,
      // alwaysOnTop: true,
    },
    createWindowCallback,
  )

  let open = async (top) => {
    if (currentPopupId) {
      chrome.windows.update(currentPopupId,
        { focused: true },
        (openWindow) => {
          if (openWindow) {
            getActiveTab().then((tab) => {
            //   chrome.tabs.update(tab.id, { url: chrome.runtime.getURL(url) + '?cmd=' + (isAddMode ? 'to-add' : 'clear') })
              chrome.tabs.sendMessage(tab.id, (isAddMode ? 'to-add' : 'clear'), function (response) {
                console.log(response)
              })
            })
            return
          }

          create(top)
        })
    } else {
      create(top)
    }
  }

  let value = {}
  value.windowId = activeTab?.windowId
  await storage.set(value)

  await open(screen.height - height)
}

chrome.windows.onRemoved.addListener(
  async (windowId) => {
    if (windowId === currentPopupId) {
      currentPopupId = null
    }
  },
  { windowTypes: ['popup'] },
)

let popupUrl = 'popup/popup.html'
async function openPopup(tab, isAddMode) {
  await getOrCreatePopup(tab, popupUrl, 500, tab ? tab.height : 1000, isAddMode)
}

chrome.commands.onCommand.addListener(async (command) => {
  console.log('Command:' + command)
  switch (command) {
    case 'open-search': {
      getActiveTab()
        .then(activeTab => openPopup(activeTab, false))
      break
    }
    case 'add-tab-to-session': {
      getActiveTab()
        .then(activeTab => openPopup(activeTab, true))
      break
    }
    default: {
      console.log(command)
    }
  }
})

chrome.browserAction.onClicked.addListener((tab) => {
  openPopup(tab, false)
})
