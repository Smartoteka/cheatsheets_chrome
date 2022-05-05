import storage from '../utils/storage'
import { getActiveTab, queryTabs } from '../src_jq/common/commonFunctions'

async function getOrCreatePopup(windowName, activeTab, url, width, height, isAddMode) {
  const windowStorageId = windowName + chrome.runtime.id

  let createWindowCallback = async (openedWindow) => {
    let value = {}
    value[windowStorageId] = openedWindow.id
    console.log('save ' + openedWindow.id)
    await storage.set(value)

    chrome.windows.onRemoved.addListener(
      async (windowId) => {
        let currentPopupId = await storage.get(windowStorageId)
        console.log('currentPopupId  ' + currentPopupId)
        if (windowId === currentPopupId) {
          currentPopupId = null
        }
      },
      { windowTypes: ['popup'] },
    )
  }

  let [displayInfo] = await chrome.system.display.getInfo()

  let create = (top) => {
    console.log('Create popup!')

    chrome.windows.create(
      {
        url: chrome.runtime.getURL(url) + '?cmd=' + (isAddMode ? 'to-add' : 'clear'),
        type: 'popup',
        focused: true,
        height: height,
        width: width,
        top: top,
        left: displayInfo.bounds.width - width,
        // alwaysOnTop: true,
      },
      createWindowCallback,
    )
  }

  let currentPopupId = await storage.get(windowStorageId)

  let open = async (top) => {
    if (currentPopupId) {
      console.log('update popup!')
      try {
        await chrome.windows.update(currentPopupId,
          { focused: true })

        queryTabs(currentPopupId).then((tab) => {
          if (tab && tab.url.indexOf(chrome.runtime.id) !== -1) {
            chrome.tabs.sendMessage(tab.id, (isAddMode ? 'to-add' : 'clear'), function (response) {
              console.log(response)
            })
          } else {
            console.log(tab)
            create(top)
          }
        })
      } catch (error) {
        console.log('Not open window')
        create(top)
      }
    } else {
      console.log('Not currentPopupId')
      create(top)
    }
  }

  await open(100)
}

let popupUrl = 'popup/popup.html'
async function openPopup(tab, isAddMode) {
  await getOrCreatePopup('popup', tab, popupUrl, 500, tab ? tab.height : 1000, isAddMode)
}

chrome.commands.onCommand.addListener(async (command) => {
  console.log('Command:' + command)
  switch (command) {
    case 'open-search': {
      getActiveTab()
        .then(activeTab => {
          storage.set({ windowId: activeTab.windowId })
          openPopup(activeTab, false)
        })
      break
    }
    case 'open-search-on-page': {
      getActiveTab()
        .then(tab => getOrCreatePopup('search', tab, 'search/search.html', 500, 400, false))
      break
    }
    case 'add-tab-to-session': {
      getActiveTab()
        .then(activeTab => {
          storage.set({ windowId: activeTab.windowId })
          openPopup(activeTab, true)
        })
      break
    }
    default: {
      console.log(command)
    }
  }
})

chrome.action.onClicked.addListener((tab) => {
  openPopup(tab, false)
})
