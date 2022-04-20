import { unique, grapTags, unwrapCheatSheet } from './commonFunctions'
import {
  setSearchHashs, hashCode, buildSternBrokkoTree, sortSternBroko,
} from './cheatSheetsManage'
import { comparerFunc } from './rateTags'

class SmartotekaFabricLocalStorage {
  #getFromStorage(memberName, defaultValue) {
    let that = this
    return new Promise((resolve) => {
      if (that[memberName]) {
        resolve(that[memberName], false)
      } else {
        chrome.storage.local.get([memberName], (storage) => {
          if (!storage || !(storage[memberName])) {
            console.log('Add ' + memberName)
            storage = defaultValue

            resolve(storage)
          } else {
            resolve(storage[memberName])
          }

          that[memberName] = storage[memberName]
        })
      }
    })
  }

  #getCheatSheets() {
    return this.#getFromStorage('CheatSheets', [])
  }

  #getTags() {
    return this.#getFromStorage('Tags', [])
  }

  #getSpeedDeal() {
    return this.#getFromStorage('SpeedDeal', {})
  }

  #validateTags(tags) {
    tags.forEach(tag => {
      if (!tag.text) { throw new Error('Empty tag!') }
      if (!tag.id) { throw new Error('Not find id in tag ' + tag.text) }
      //  if (!tag.uid || !parseInt(tag.uid, 10)) { throw new Error('Not find uid in tag ' + tag.text) }

      // if (tags.length !== unique(tags, tag => tag.uid).length) { throw new Error('not unique tags by uid!') }
      if (tags.length !== unique(tags, tag => tag.text).length) { throw new Error('not unique tags by tags!') }
    })
  }

  #saveTags(tags) {
    let that = this

    this.#validateTags(tags)

    return new Promise(
      r => chrome.storage.local.set(
        { Tags: unique(tags, el => el.id) },
        () => {
          that.Tags = null
          r()
        },
      ),
    )
  }

  #saveSpeedDeal(speedDeal) {
    return new Promise(r => chrome.storage.local.set({ SpeedDeal: speedDeal }, () => r()))
  }

  #saveCheatSheets(cheatsheets) {
    let that = this

    cheatsheets.forEach(cheatsheet => {
      if (!cheatsheet.id) { throw new Error('Not find id in cheatsheet') }

      if (!cheatsheet.date) { throw new Error('Empty date! ' + cheatsheet.id) }

      if (!cheatsheet.d) { throw new Error('Not find d in cheatsheet ' + cheatsheet.id) }
      if (!cheatsheet.n) { throw new Error('Not find n in cheatsheet ' + cheatsheet.id) }
      if (!cheatsheet.type) { throw new Error('Not find n in cheatsheet ' + cheatsheet.id) }

      if (!cheatsheet.tags) { throw new Error('Not find tags in cheatsheet ' + cheatsheet.id) }

      // if (!cheatsheet.orderedTags) { throw new Error('Not find orderedTags in cheatsheet ' + cheatsheet.id) }
      that.#validateTags(cheatsheet.tags)
    })

    return new Promise(
      r => chrome.storage.local.set(
        { CheatSheets: cheatsheets },
        () => {
          that.Tags = null
          that.CheatSheets = null
          r()
        },
      ),
    )
  }

  queriesProvider() {
    let parent = this

    class SmartotekaQueryManager {
      constructor() {

      }

      #downloadObjectAsJson(exportObj, exportName) {
        let dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj))
        let downloadAnchorNode = document.createElement('a')
        downloadAnchorNode.setAttribute('href', dataStr)
        downloadAnchorNode.setAttribute('download', exportName + '.json')
        document.body.appendChild(downloadAnchorNode) // required for firefox
        downloadAnchorNode.click()
        downloadAnchorNode.remove()
      }

      export(fileName) {
        let promise = new Promise((resolve, reject) => {
          Promise.all([
            parent.#getTags(),
            parent.#getCheatSheets(),
          ])
            .then(([Tags, CheatSheets]) => {
              this.#downloadObjectAsJson(
                {
                  Tags: Tags.sort(comparerFunc(el => el.text)),
                  CheatSheets: sortSternBroko(CheatSheets),
                },
                fileName,
              )

              resolve(true)
            })
        })

        return promise
      }

      exportSpeedDeal(fileName) {
        let promise = new Promise((resolve, reject) => {
          Promise.all([
            parent.#getSpeedDeal(),
          ])
            .then(([SpeedDeal]) => {
              this.#downloadObjectAsJson(
                SpeedDeal,
                fileName,
              )

              resolve(true)
            })
        })

        return promise
      }

      getTags() {
        return parent.#getTags()
      }

      getCheatSheets() {
        return parent.#getCheatSheets()
      }

      getSpeedDeal() {
        return parent.#getSpeedDeal()
      }
    }

    return new SmartotekaQueryManager()
  }

  KBManager() {
    let parent = this

    class SmartotekaManager {
      constructor() {

      }

      import(json) {
        let cheatsheets = json.CheatSheets || []

        cheatsheets = cheatsheets.map((cheatsheet) => unwrapCheatSheet(cheatsheet, cheatsheet.tags))
        let allTags = grapTags(cheatsheets, json.Tags || [])

        allTags.forEach(el => el.uid = hashCode(el.text))
        allTags = unique(allTags, el => el.uid)
        cheatsheets.forEach((ch) => {
          ch.tags.forEach(el => el.uid = hashCode(el.text))
          ch.tags = unique(ch.tags, el => el.uid)
        })
        // setSearchHashs(cheatsheets, allTags)

        buildSternBrokkoTree(cheatsheets, -1, cheatsheets.length)
        parent.#saveCheatSheets(cheatsheets)
        parent.#saveTags(allTags)
      }

      importSpeedDeal(json) {
        parent.#saveSpeedDeal(json || {})
      }

      addTags(newTags) {
        return new Promise(resolve => {
          if (newTags.length == 0) {
            resolve()
          }

          parent.#getTags()
            .then(tags => {
              tags = [...tags, ...newTags.map(el => ({ id: el.id, text: el.text, uid: hashCode(el.text.toLowerCase()) }))]
              parent.#saveTags(tags)

              resolve()
            })
        })
      }

      addCheatSheet(cheatSheet) {
        return this.addCheatSheets([cheatSheet])
      }

      addCheatSheets(newCheatSheets) {
        return new Promise((resolve, reject) => {
          if (newCheatSheets.length === 0) {
            resolve()
            return
          }
          if (!newCheatSheets[0].tags) {
            reject('Cheatsheet should contains tags!')
            return
          }

          // setSearchHashs(newCheatSheets)

          parent.#getCheatSheets()
            .then(cheatsheets => {
              cheatsheets = [...cheatsheets, ...newCheatSheets]
              parent.#saveCheatSheets(cheatsheets)
                .then(() => resolve())
            })
        })
      }

      updateCheatSheets(updateCheatSheets) {
        return new Promise(resolve => {
          parent.#getCheatSheets()
            .then(cheatsheets => {
              // setSearchHashs(updateCheatSheets)

              updateCheatSheets
                .forEach(cheatSheet => {
                  let index = cheatsheets.findIndex(el => el.id === cheatSheet.id)
                  if (index !== -1) {
                    cheatsheets[index] = cheatSheet
                  }
                })

              parent.#saveCheatSheets(cheatsheets)
                .then(() => resolve())
            })
        })
      }

      deleteCheatSheets(deleteCheatSheets) {
        return new Promise(resolve => {
          parent.#getCheatSheets()
            .then(cheatsheets => {
              deleteCheatSheets.forEach(cheatSheet => {
                let index = cheatsheets.findIndex(el => el.content === cheatSheet.content && el.id === cheatSheet.id)
                if (index !== -1) {
                  cheatsheets.splice(index, 1)
                }
              })

              parent.#saveCheatSheets(cheatsheets)
                .then(() => resolve())
            })
        })
      }
    }

    return new SmartotekaManager()
  }
}

export default SmartotekaFabricLocalStorage
