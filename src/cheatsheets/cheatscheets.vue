<template>
  <div class="popup">
    <Navbar :popup="popup">
      <img
        class="add ctrl-img"
        src="/images/plus-square.svg"
        @click="addCheatSheet"
        v-if="!newCheatSheet"
      />
      <StatusBar class="statusbar"></StatusBar>
    </Navbar>
    <main>
      <div id="speedDealHelp"></div>

      <addBlock v-if="newCheatSheet" class="row">
        <addModes class="selectElementInLine">
          <div
            v-for="v in addModes.filter((el) => !el.isAllow || el.isAllow())"
            :key="v.title"
            @click="addMode = v.title"
            :class="
              'pointer ' + (v.title == addMode ? 'selected' : 'unselected')
            "
          >
            {{ v.title }}
          </div>
        </addModes>
        <CheatSheet
          style="min-width: 350px; width: 100%"
          :cheatsheet="newCheatSheet"
          :allTags="options"
          v-on:update-cheatsheet="saveNewCheatSheet"
          v-on:cancel-edit="cancelNewCheatSheet"
          :edit="true"
          :hideContent="addMode === 'Session'"
        ></CheatSheet>
        <CheatSheet
          v-for="ch in sesstionTabs"
          :key="ch.id"
          :cheatsheet="ch"
          :readOnly="true"
          draggable="true"
          @dragstart="startSessionTabDrag($event, ch)"
        ></CheatSheet>
      </addBlock>

      <div
        v-if="newCheatSheet && addMode === 'Session'"
        @click="distributeTabToGroups = !distributeTabToGroups"
        style="cursor: pointer; margin-top: 10px; margin-bottom: 10px"
      >
        {{
          distributeTabToGroups
            ? "Close Drag & drop mode"
            : "Drag & drop by groups"
        }}
      </div>

      <search v-if="!newCheatSheet || distributeTabToGroups">
        <!-- <p>Selected: {{ selected }}</p> -->
        <div style="display: flex">
          <select2
            :options="options"
            v-model="selected"
            :searchResults="searchResults"
          >
          </select2>
          <img
            class="ctrl-img search-img"
            src="/images/google.svg"
            @click="google"
            v-if="!newCheatSheet"
          />
          <img
            class="ctrl-img search-img"
            src="/images/stack-overflow.svg"
            @click="stackoverflow"
            v-if="!newCheatSheet"
          />
        </div>
        <!-- <div class="selectElementInLine">
          <div
            v-for="v in selectVariants"
            :key="v.title"
            @click="v.handler()"
            class="pointer"
          >
            {{ v.title }}
          </div>
        </div> -->
        <div style="margin-top: 10px">
          <!-- :showAll="
              (groups.length === 1 || searchResults.length < 4)
            " -->
          <CheatSheetGroup
            v-for="group in groups"
            :key="group.id"
            :group="group"
            :showChildren="groups.length <= 2"
            :allTags="options"
            v-on:update-cheatsheet="updateCheatSheet($event)"
            v-on:remove-cheatsheets="removeCheatSheets($event)"
            v-on:move-to-tags="moveToTags($event)"
            v-on:drop-session-tabs-to-group="sessionTabsToGroup($event)"
            v-on:drop-cheat-sheets-to-group="dropCheatSheetsToGroup($event)"
          />
        </div>
      </search>
    </main>
  </div>
</template>

<script>
import jQuery from 'jquery'
import storage from '@/utils/storage'
import Navbar from '@/common/Navbar'

import CheatSheet from './components/CheatSheet'
import CheatSheetGroup from './components/CheatSheetGroup'
import Select2 from '@/common/Select2'
import StatusBar from './components/StatusBar'

import {
  unique,
  getSmartotekaFabric,
  getActiveTab,
  getAllTabsByWindow,
  unwrapCheatSheet,
  getGroupTags,
  openTabs,
} from '@/src_jq/common/commonFunctions'
import { cheatsheetsGroup } from '@/src_jq/common/cheatSheetsManage'
import { getFilterByFilterTags } from '@/src_jq/common/mulitselectTagsHandlers'

window.$ = jQuery
let $ = jQuery

export default {
  name: 'App',
  components: {
    CheatSheet,
    CheatSheetGroup,
    Navbar,
    Select2,
    StatusBar,
  },
  props: {
    popup: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      distributeTabToGroups: false,
      selected: [],
      options: [],
      cheatSheets: [],
      newCheatSheet: null,
      sesstionTabs: [],
      addMode: 'Cheat Sheet',
      addModes: [
        { title: 'Cheat Sheet' },
        {
          title: 'Tab',
          isAllow: () => this.popup,
        },
        { title: 'Session' },
      ],
      selectVariants: [
        {
          title: 'All',
          handler: () => {
            this.refresh()
          },
        },
        {
          title: 'last created',
          handler: () => {
            this.refresh()
          },
        },
        {
          title: 'last finded',
          handler: () => {
            this.refresh()
          },
        },
        {
          title: 'last edited',
          handler: () => {
            this.refresh()
          },
        },
      ],
    }
  },
  beforeMount() {},
  mounted() {
    let vm = this
    console.log('mounted ' + new Date().getTime())

    chrome.runtime.onMessage.addListener(function (
      request,
      sender,
      sendResponse,
    ) {
      setTimeout(() => {
        vm.addCheatSheet()
        vm.addMode = 'Tab'
      }, 10)
      sendResponse('success!')
    })
    let params = new URLSearchParams(window.location.search)

    if (params.get('cmd') === 'to-add') {
      setTimeout(() => {
        vm.addCheatSheet()
        vm.addMode = 'Tab'
      }, 10)
    }

    this.refresh()

    window.addEventListener(
      'keypress',
      (e) => {
        const activeElement = document.activeElement

        if (e.code === 'Escape') {
          setTimeout(() => $(activeElement).blur())
          return
        }

        if (activeElement.type === 'textarea'
        || activeElement.type === 'text'
        || $(activeElement).closest('.toastui-editor').length > 0
        ) {
          return
        }

        switch (e.key) {
          case 'f':
            setTimeout(() => $('search .select2-search__field').first().focus(), 0)
            break
          default: break
        }
      },
      false,
    )

    setTimeout(() => $('search .select2-search__field').focus(), 5)
  },
  computed: {
    groups() {
      let cheatsheets = this.searchResults
      let result = cheatsheetsGroup(cheatsheets)

      return result
    },
    searchResults() {
      console.log('searchResults')
      let selectedTags = this.selected.map((el) => el.text)

      // TODO: if(selectedTabs.length===0)Вывести топ 10 самых часто используемых
      let filterTags = {}

      let countTags = 0
      unique(selectedTags, (el) => el).map((tag) => {
        countTags += 1
        filterTags[tag] = countTags
        return 0
      })

      filterTags.count = countTags
      let filterByTags = getFilterByFilterTags(
        (el) => el,
        () => filterTags,
      )

      return (this.cheatSheets || []).filter(
        (cheatsheet) => filterTags[cheatsheet.query] || filterByTags(cheatsheet),
      )
    },
    smartotekaFabric() {
      return getSmartotekaFabric()
    },
  },
  watch: {
    addMode: async function (value) {
      this.sesstionTabs = []

      switch (value) {
        case 'Cheat Sheet':
          break

        case 'Session':
          let windowId = await storage.get('windowId')
          getAllTabsByWindow(windowId).then((tabs) => {
            let date = new Date()

            let sessionTag = 'Session ' + date.toLocaleString().replace(',', '')
            this.newCheatSheet.tags.push({ id: sessionTag, text: sessionTag })

            let i = 0
            this.sesstionTabs = tabs.map((tab) => {
              i += 1
              return {
                id: parseInt(date.getTime() + '' + i, 10),
                date: date,
                content: this.tabLinkMarkdown(tab),
                tags: [],
                link: tab.url,
              }
            })
          })
          break
        case 'Tab':
          windowId = await storage.get('windowId')
          getActiveTab(windowId).then((tab) => {
            this.newCheatSheet.content = this.tabLinkMarkdown(tab)
            this.newCheatSheet.link = tab.url
          })
          break
        default:
          throw new Error('Unexpected addMode' + value)
      }
    },
  },
  methods: {
    startSessionTabDrag(evt, item) {
      // TODO: сделать перетаскивание группами
      // TODO: сделать перемещение и копирование в группы

      let ids = item.selected
        ? this.sesstionTabs.filter((el) => el.selected).map((el) => el.id)
        : [item.id]
      evt.dataTransfer.dropEffect = 'copy'
      evt.dataTransfer.effectAllowed = 'copy'
      evt.dataTransfer.setData(
        'data',
        JSON.stringify({ ids: ids, type: 'sessionTabs' }),
      )
    },
    tabLinkMarkdown(tab) {
      let markdown = ''

      if (tab.favIconUrl) {
        markdown += '![Icon](' + tab.favIconUrl + ')'
      }
      markdown += '[' + tab.title + '](' + tab.url + ')'

      return markdown
    },
    moveToTags(tags) {
      this.selected = tags
    },
    addCheatSheet() {
      let date = new Date().valueOf()
      this.newCheatSheet = {
        id: date,
        date: date,
        content: '',
        tags: this.selected.slice(0),
      }
    },
    saveNewCheatSheet(cheatsheet) {
      switch (this.addMode) {
        case 'Cheat Sheet':
        case 'Tab':
          this.smartotekaFabric
            .KBManager()
            .addCheatSheet(cheatsheet)
            .then(() => {
              this.resetEditState()

              this.refresh()
            })
          break

        case 'Session':
          let tabsToSave = this.sesstionTabs
            .filter((el) => el.selected)
            .map((ch) => unwrapCheatSheet(ch, cheatsheet.tags))

          if (tabsToSave.length === 0) {
            tabsToSave = this.sesstionTabs.map((ch) => unwrapCheatSheet(ch, cheatsheet.tags))
          }
          this.smartotekaFabric
            .KBManager()
            .addCheatSheets(tabsToSave)
            .then(() => {
              this.resetEditState()

              this.refresh()
            })
          break
        default:
          throw new Error('Unexpected addMode' + this.addMode)
      }
    },
    resetEditState() {
      this.newCheatSheet = null
      this.addMode = 'Cheat Sheet'
      this.sesstionTabs = []
      this.distributeTabToGroups = false
    },
    cancelNewCheatSheet() {
      this.resetEditState()
    },
    refresh() {
      this.smartotekaFabric
        .queriesProvider()
        .getCheatSheets()
        .then((cheatsheets) => {
          this.refreshByData(cheatsheets)
          // cheatsheets.forEach((el) => {
          //   el.type = 'cheatsheet'
          // })
          // this.smartotekaFabric
          //   .queriesProvider()
          //   .getSessions()
          //   .then((sessions) => {
          //     let data = cheatsheets

          // cheatsheets.forEach((v) => (v.id = v.date))
          // sessions.map((session) => {
          //   let i = 0
          //   let tags = session.tags
          //   tags.push({ id: session.query, text: session.query })

          //   let cheatsheetsSession = session.tabs.map((tab) => {
          //     i += 1

          //     let id = parseInt(session.date + '' + i, 10)

          //     return {
          //       id: id,
          //       date: session.date,
          //       type: 'cheatsheet',
          //       link: tab.url,
          //       content:
          //         '![Icon]('
          //         + tab.favIconUrl
          //         + ')['
          //         + tab.title
          //         + ']('
          //         + tab.url
          //         + ')',
          //       tags: tags,
          //     }
          //   })

          //   data = data.concat(cheatsheetsSession)

          //   this.smartotekaFabric.KBManager().saveCheatSheets(data)
          //   return 0
          // })

          // this.refreshByData(data)
          // })
        })
    },
    refreshByData(cheatSheets) {
      this.cheatSheets = cheatSheets

      let allTags = []

      cheatSheets.forEach((el) => {
        allTags = allTags.concat(el.tags)

        return 0
      })

      this.options = unique(
        allTags.filter((el) => el),
        (el) => el.id,
      )
    },
    updateCheatSheet(cheatsheet) {
      this.smartotekaFabric
        .KBManager()
        .updateCheatSheets([cheatsheet])
        .then(() => this.refresh())
    },
    removeCheatSheets(cheatsheets) {
      if (confirm('Are you sure?')) {
        this.smartotekaFabric
          .KBManager()
          .deleteCheatSheets(cheatsheets)
          .then(() => this.refresh())
      }
    },
    sessionTabsToGroup(event) {
      let tabsIds = event.ids
      let group = event.group
      let tags = getGroupTags(group)

      let cheatSheets = this.sesstionTabs
        .filter((el) => tabsIds.indexOf(el.id) >= 0)
        .map((el) => unwrapCheatSheet(el, tags))

      if (cheatSheets.length > 0) {
        this.smartotekaFabric
          .KBManager()
          .addCheatSheets(cheatSheets)
          .then(() => {
            cheatSheets.forEach((el) => group.items.push(el))
          })
      }
    },
    dropCheatSheetsToGroup(event) {
      let group = event.group
      let tags = getGroupTags(group)

      let cheatSheets = event.cheatsheets.map((el) => unwrapCheatSheet(el, tags))

      if (cheatSheets.length > 0) {
        this.smartotekaFabric
          .KBManager()
          .updateCheatSheets(cheatSheets)
          .then(() => {
            cheatSheets.forEach((el) => group.items.push(el))
          })
      }
    },
    google() {
      let tags = this.selected.map((el) => el.text).join(' ')
      let tab = { url: 'https://www.google.com/search?q=' + tags }
      openTabs([tab])
    },
    stackoverflow() {
      let tags = this.selected.map((el) => el.text).join(' ')
      let tab = { url: 'https://stackoverflow.com/search?q=' + tags }
      openTabs([tab])
    },
  },
}
</script>

<style lang="scss" scoped>
.statusbar {
  position: absolute;
  right: 0px;
}
#speedDealHelp {
  font-size: 150%;
  font-weight: bold;
  display: none;

  .values {
    color: green;
  }
}
.el-tabs__header {
  margin: 0;
}
.el-tabs__nav {
  width: 100% !important;
  display: flex;
  justify-content: space-evenly;
}
.recorder {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 300px;
  background: white;
}

.main {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  position: fixed;
  top: 90px;
  width: 100%;
  height: calc(100% - 90px);
  overflow: auto;
  background: hsl(203deg, 34%, 95%);
}

.search-img {
  width: 16px;
  margin: 3px 3px;
}

.selected {
  color: green;
}

.unselected {
  color: inherit;
}

.pointer {
  cursor: pointer;
}
.selectElementInLine {
  display: flex;
  flex-direction: row;
  column-gap: 10px;
}
</style>
