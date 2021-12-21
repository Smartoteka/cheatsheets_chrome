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

  #getSmartoteka() {
    return this.#getFromStorage('Smartoteka', {})
  }

  #getCheatSheets() {
    return this.#getFromStorage('CheatSheets', [])
  }

  #getTags() {
    return this.#getFromStorage('Tags', [])
  }

  #getSessions() {
    return this.#getFromStorage('Sessions', [])
  }

  #getSpeedDeal() {
    return this.#getFromStorage('SpeedDeal', {})
  }

  #saveTags(tags) {
    return new Promise(r => chrome.storage.local.set({ Tags: unique(tags, el => el.id) }, () => r()))
  }

  #saveSessions(sessions) {
    return new Promise(r => chrome.storage.local.set({ Sessions: sessions }, () => r()))
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

      search(query) {
        let promise = new Promise((resolve, reject) => {
          parent.#getSmartoteka()
            .then((smartoteka) => {
              let searchResults = smartoteka[query]

              resolve(searchResults)
            })
        })

        return promise
      }

      isUseful(url) {
        return new Promise((resolve) => resolve(url.charCodeAt(url.length - 1) % 2 === 0 ? [1] : []))
      }

      export(fileName) {
        let promise = new Promise((resolve, reject) => {
          Promise.all([
            parent.#getSmartoteka(),
            parent.#getTags(),
            parent.#getSessions(),
            parent.#getCheatSheets(),
          ])
            .then(([Smartoteka, Tags, Sessions, CheatSheets]) => {
              this.#downloadObjectAsJson(
                {
                  Smartoteka,
                  Tags,
                  Sessions,
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

      getSessions() {
        return parent.#getSessions()
      }

      getCheatSheets() {
        return parent.#getCheatSheets()
      }

      getSelectSessionId() {
        return parent.#getFromStorage('selectSessionId', null)
      }

      getSelectSession() {
        return new Promise(r => {
          Promise.all([
            this.getSessions(),
            this.getSelectSessionId()])
            .then((values) => {
              let [sessions, sessionId] = values

              let index = sessions.findIndex(el => el.date === sessionId)

              let session = index < 0 ? null : sessions[index]

              r(session)
            })
        })
      }

      getSession(sessionId) {
        return new Promise(r => {
          this.getSessions()
            .then((sessions) => {
              let index = sessions.findIndex(el => el.date === sessionId)

              let session = index < 0 ? null : sessions[index]

              r(session)
            })
        })
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

      add(query, content) {
        parent.#getSmartoteka()
          .then((smartoteka) => {
            let queryLinks = smartoteka[query]

            if (!queryLinks) {
              queryLinks = smartoteka[query] = [content]
            } else if (queryLinks.indexOf(content) < 0) queryLinks.push(content)

            parent.#save(smartoteka)
          })
      }

      remove(query, answer) {
        return new Promise(resolve => {
          parent.#getSmartoteka()
            .then((smartoteka) => {
              let queryLinks = smartoteka[query]

              if (queryLinks) {
                let index = queryLinks.indexOf(answer)

                if (index > -1) {
                  queryLinks.splice(index, 1)

                  if (queryLinks.length === 0) {
                    delete smartoteka[query]
                  }

                  parent.#save(smartoteka)
                  resolve()
                }
              }
            })
        })
      }

      setSelectSession(sessionId) {
        return new Promise(r => chrome.storage.local.set({ selectSessionId: sessionId }, () => r()))
      }

      saveCheatSheets(cheatSheets) {
        parent.#saveCheatSheets(cheatSheets)
      }

      import(json) {
        let sessions = json.Sessions || []
        let cheatSheets = json.CheatSheets || []

        parent.#save(json.Smartoteka || {})
        parent.#saveSessions(sessions)
        parent.#saveCheatSheets(cheatSheets)

        let allTags = []

        cheatSheets.forEach(el => allTags = allTags.concat(el.tags))
        sessions.forEach(el => allTags = allTags.concat(el.tags))
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

      addSession(session) {
        return new Promise(resolve => {
          parent.#getSessions()
            .then(sessions => {
              sessions = [...sessions, session]
              parent.#saveSessions(sessions)

              resolve()
            })
        })
      }

      addCheatSheet(cheatSheet) {
        return this.addCheatSheets([cheatSheet])
      }

      addCheatSheets(newCheatSheets) {
        return new Promise(resolve => {
          parent.#getCheatSheets()
            .then(cheatSheets => {
              cheatSheets = [...cheatSheets, ...newCheatSheets]
              parent.#saveCheatSheets(cheatSheets)

              resolve()
            })
        })
      }

      updateSession(session) {
        return new Promise(resolve => {
          parent.#getSessions()
            .then(sessions => {
              let index = sessions.findIndex(el => el.date === session.date)
              if (index !== -1) {
                sessions[index] = session
              }
              parent.#saveSessions(sessions)
                .then(() => resolve())
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

      deleteSession(session) {
        return new Promise(resolve => {
          parent.#getSessions()
            .then(sessions => {
              let index = sessions.findIndex(el => el.query === session.query && el.date === session.date)
              if (index !== -1) {
                sessions.splice(index, 1)
              }
              parent.#saveSessions(sessions)
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
// window.SmartotekaFabricLocalStorage = SmartotekaFabricLocalStorage
