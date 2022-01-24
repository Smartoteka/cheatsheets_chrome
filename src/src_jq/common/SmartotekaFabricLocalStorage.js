import { unique } from './commonFunctions'

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

  #saveTags(tags) {
    let that = this
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
                  Tags,
                  CheatSheets,
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
        parent.#saveCheatSheets(cheatsheets)

        let allTags = []

        cheatsheets.forEach(el => allTags = allTags.concat(el.tags))
        allTags = allTags.concat(json.Tags || [])

        allTags = unique(allTags.filter(el => el), el => el.id)
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
              tags = [...tags, ...newTags.map(el => ({ id: el.id, text: el.text }))]
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
