// for vuex sync
// import store from '../store/index'

// chrome.runtime.onInstalled.addListener(() => {
//   chrome.storage.sync.set({ color });
//   console.log('Default background color set to %cgreen', `color: ${color}`);
// });

// chrome.tabs.onActivated.addListener(activeInfo => move(activeInfo));

// async function move(activeInfo) {
//   console.log(activeInfo);
// }

// TODO move to separate module
import storage from '@/utils/storage'
import { getActiveTab } from '@/src_jq/common/commonFunctions'

async function getOrCreatePopup(activeTab, url, width, height, isAddMode) {
  let activateTab = async (tab) => {
    let value = {}
    value[url] = tab.id
    await storage.set(value)
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
    activateTab,
  )

  let open = async (top) => {
    let popup = await storage.get(url)
    if (popup) {
      chrome.windows.update(popup,
        { focused: true },
        (openWindow) => {
          if (openWindow) {
            getActiveTab().then((tab) => {
              chrome.tabs.update(tab.id, { url: chrome.runtime.getURL(url) + '?cmd=' + (isAddMode ? 'to-add' : 'clear') })
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
  value.windowId = activeTab.windowId
  await storage.set(value)

  await open(screen.height - activeTab.height)
}

async function openPopup(tab, isAddMode) {
  await getOrCreatePopup(tab, 'popup/popup.html', 500, tab.height, isAddMode)
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

chrome.runtime.onInstalled.addListener(async (details) => {
  await storage.set({ popup: null })
})

chrome.browserAction.onClicked.addListener((tab) => {
  openPopup(tab, false)
})

chrome.windows.onRemoved.addListener(async (windowId) => {
  let popup = await storage.get('popup')
  if (windowId === popup) {
    await storage.set({ popup: null })
  }
})

// chrome.action.onClicked.addListener((tab) => {
//   console.log("Tab:" + tab);
// });
