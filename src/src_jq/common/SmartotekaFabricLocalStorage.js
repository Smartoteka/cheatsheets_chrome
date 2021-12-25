import { unique } from '@/src_jq/common/commonFunctions'

class SmartotekaFabricLocalStorage {
  #save(smartoteka) {
    return new Promise(r => chrome.storage.local.set({ Smartoteka: smartoteka }, () => r()))
  }

  #getFromStorage(memberName, defaultValue) {
    return new Promise((resolve) => {
      chrome.storage.local.get([memberName], (storage) => {
        if (!storage || !(storage[memberName])) {
          console.log('Add ' + memberName)
          storage = defaultValue

          this.#save(storage)

          resolve(storage)
        } else {
          resolve(storage[memberName])
        }
      })
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
    return new Promise(r => chrome.storage.local.set({ Tags: unique(tags, el => el.id) }, () => r()))
  }

  #saveSpeedDeal(speedDeal) {
    return new Promise(r => chrome.storage.local.set({ SpeedDeal: speedDeal }, () => r()))
  }

  #saveCheatSheets(cheatSheets) {
    return new Promise(r => chrome.storage.local.set({ CheatSheets: cheatSheets }, () => r()))
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

      saveCheatSheets(cheatSheets) {
        parent.#saveCheatSheets(cheatSheets)
      }

      import(json) {
        let cheatSheets = json.CheatSheets || []
        parent.#saveCheatSheets(cheatSheets)

        let allTags = []

        cheatSheets.forEach(el => allTags = allTags.concat(el.tags))
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
              tags = [...tags, ...newTags]
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
            .then(cheatSheets => {
              cheatSheets = [...cheatSheets, ...newCheatSheets]
              parent.#saveCheatSheets(cheatSheets)

              resolve()
            })
        })
      }

      updateCheatSheets(updateCheatSheets) {
        return new Promise(resolve => {
          parent.#getCheatSheets()
            .then(cheatSheets => {
              updateCheatSheets
                .forEach(cheatSheet => {
                  let index = cheatSheets.findIndex(el => el.id === cheatSheet.id)
                  if (index !== -1) {
                    cheatSheets[index] = cheatSheet
                  }
                })

              parent.#saveCheatSheets(cheatSheets)
                .then(() => resolve())
            })
        })
      }

      deleteCheatSheets(deleteCheatSheets) {
        return new Promise(resolve => {
          parent.#getCheatSheets()
            .then(cheatSheets => {
              deleteCheatSheets.forEach(cheatSheet => {
                let index = cheatSheets.findIndex(el => el.content === cheatSheet.content && el.id === cheatSheet.id)
                if (index !== -1) {
                  cheatSheets.splice(index, 1)
                }
              })

              parent.#saveCheatSheets(cheatSheets)
                .then(() => resolve())
            })
        })
      }
    }

    return new SmartotekaManager()
  }
}

export default SmartotekaFabricLocalStorage
