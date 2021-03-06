import SmartotekaFabricLocalStorage from './SmartotekaFabricLocalStorage'
import { comparerFunc } from './rateTags'

export function grapTags(cheatsheets, tags = []) {
  let allTags = []

  cheatsheets.forEach(el => allTags = allTags.concat(el.tags))
  allTags = allTags.concat(tags)

  allTags = unique(allTags.filter(el => el), el => el.id)
  return allTags
}

export function truncate(text, length, clamp) {
  clamp = clamp || '...'
  let node = document.createElement('div')
  node.innerHTML = text
  let content = node.textContent
  return content.length > length ? content.slice(0, length) + clamp : content
}

export function throttle(func, ms) {
  let savedArgs
  let savedThis

  let timerId = null
  function wrapper() {
    savedArgs = arguments
    savedThis = this

    if (timerId) { clearTimeout(timerId) }

    timerId = setTimeout(function () {
      timerId = null
      func.apply(savedThis, savedArgs)
      savedArgs = savedThis = null
    }, ms)
  }

  return wrapper
}

export function secondRunImmediately(func, ms) {
  let savedArgs
  let savedThis

  let timerId = null
  function wrapper() {
    savedArgs = arguments
    savedThis = this

    if (timerId) {
      clearTimeout(timerId)

      func.apply(savedThis, savedArgs)
      savedArgs = savedThis = null
    } else {
      timerId = setTimeout(function () {
        timerId = null
        func.apply(savedThis, savedArgs)
        savedArgs = savedThis = null
      }, ms)
    }
  }

  return wrapper
}

export function arraysIsEqual(array1, array2, get) {
  return array1.length === array2.length
  && array1.every(function (value, index) { return get(value) === get(array2[index]) })
}

export function moveInArray(arr, fromIndex, toIndex) {
  let element = arr[fromIndex]
  arr.splice(fromIndex, 1)
  arr.splice(toIndex, 0, element)
}

export function mergeArraysById(a1, a2, getId) {
  return [
    ...a1,
    ...a2.filter(el2 => a1.findIndex(el1 => getId(el1) === getId(el2)) < 0)]
}

export function unique(array, getFieldValue) {
  return array.filter((value, index, self) => self.findIndex(el => getFieldValue(el) == getFieldValue(value)) === index)
}

export function joinArrays(arrays, getValue) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i] = arrays[i].sort(comparerFunc(getValue))
  }

  let joinTags = []
  let indexes = arrays.map(_ => 0)

  for (indexes[0] = 0; indexes[0] < arrays[0].length; indexes[0]++) {
    let value = getValue(arrays[0][indexes[0]])

    let findCount = 0
    for (j = 1; j < arrays.length && findCount === j - 1; j++) {
      let currentArray = arrays[j]
      let k = indexes[j]
      for (; k < currentArray.length; k++) {
        let nextArrayValue = getValue(currentArray[k])

        if (value <= nextArrayValue) {
          findCount += (value === nextArrayValue ? 1 : 0)
          break
        }
      }

      indexes[j] = k
    }

    if (findCount === arrays.length - 1) {
      joinTags.push(arrays[0][indexes[0]])
    }
  }

  return joinTags
}

export function openTabs(tabs, windowId) {
  windowId = windowId || chrome.windows.WINDOW_ID_CURRENT

  tabs.forEach(tab => chrome.tabs.create({ url: tab.url, windowId }))
}

export function openTabsInNewWindow(tabs) {
  if (!tabs.length) {
    return
  }

  createWindow(tabs[0].url)
    .then(window => {
      tabs.splice(0, 1)

      openTabs(tabs, window.id)
    })
}

export function createWindow(url) {
  return new Promise(r => {
    chrome.windows.create({ url: url }, window => r(window))
  })
}

export function getAllTabs() {
  return new Promise(r => chrome.tabs.query({}, (tabs) => r(tabs)))
}

export function getAllTabsByWindow(windowId) {
  return new Promise(r => chrome.tabs.query({
    windowId: windowId,
  }, (tabs) => r(tabs)))
}

export function getActiveTab(windowId) {
  let params = { active: true }

  if (windowId) {
    params.windowId = windowId
  } else {
    params.currentWindow = true
  }
  return new Promise(r => chrome.tabs.query(params, (tabs) => r(tabs.length ? tabs[0] : null)))
}

export function closeTabs(tabs) {
  return new Promise(r => chrome.tabs.remove(tabs.map(el => el.id), r))
}

export function closeTabsByUrlIfOpen(tabsToClose) {
  let tabUrls = tabsToClose.map(tab => tab.url)

  getAllTabs()
    .then((tabs) => {
      let getTabsToClose = () => tabs.filter(tab => tabUrls.indexOf(tab.url) >= 0)
      closeTabs(getTabsToClose())

      let tabsToClose = getTabsToClose()

      if (tabsToClose.length === 1) {
        chrome.windows.remove(tabsToClose.map(tab => tab.windowId)[0])
      }
    })
}

export function redirectCurrentTab(url) {
  window.location.assign(url)
}

export function createDefaultSession(tabs) {
  let now = new Date()
  let dateCreation = now.valueOf()

  let session = {
    id: dateCreation,
    date: dateCreation,
    query: now.toLocaleString({
      year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
    }),
    tags: [],
    tabs: tabs,
  }
  return session
}

export function getSmartotekaFabric() {
  return new SmartotekaFabricLocalStorage()
  // new SmartotekaFabricDGraph("https://blue-surf-390018.us-east-1.aws.cloud.dgraph.io/")
}

export function standartHandle(promise) {
  promise.then(() => {
    changeIcon('green')
    setTimeout(() => changeIcon('blue'), 1000)
  })
    .catch(error => {
      console.log(error)
      changeIcon('red')
    })
}

export function changeIcon(color) {
  let link = document.querySelector("link[rel~='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.getElementsByTagName('head')[0].appendChild(link)
  }
  link.href = '/images/icon_' + color + '_64.png'
}

export function unwrapCheatSheet(reactive, tags) {
  let result = {
    id: reactive.id,
    type: reactive.type ? reactive.type : 'cheatsheet',
    date: reactive.date,
    content: reactive.content,
    tags: unique(tags.map((el) => ({ id: el.id, text: el.text })), el => el.id),
    n: reactive.n,
    d: reactive.d,
  }

  if (reactive.link) { result.link = reactive.link }

  return result
}

export function getGroupTags(group) {
  if (group.commonTagsCount === -1) {
    return []
  }

  while (!group.items.length > 0) {
    group = group.groups[0]
  }

  return group.items[0].tags.slice(0, group.commonTagsCount)
}

export function getMatches(string, regex, index) {
  index || (index = 1) // default to the first capturing group
  let matches = []
  let match
  while (match = regex.exec(string)) {
    matches.push(match[index])
  }
  return matches
}
