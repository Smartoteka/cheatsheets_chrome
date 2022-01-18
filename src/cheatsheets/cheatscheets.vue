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
          v-on:selected="selectedSessionCheatSheet($event)"
          v-on:selected-few-elements="selectedSessionFewCheatSheets($event)"
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
            v-on:tags-input="tagsLoad"
            v-on:change="searchTagsChange"
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
       <div class="selectElementInLine">
          <div
            v-for="v in selectVariants"
            :key="v.title"
            @click="v.handler()"
            class="pointer"
          >
            {{ v.title }}
          </div>
        </div>
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
import { reactive } from 'vue'
import jQuery from 'jquery'
import storage from '../utils/storage'
import Navbar from '../common/Navbar'

import CheatSheet from './components/CheatSheet'
import CheatSheetGroup from './components/CheatSheetGroup'
import Select2 from '../common/Select2'
import StatusBar from './components/StatusBar'

import {
  unique,
  getSmartotekaFabric,
  getActiveTab,
  getAllTabsByWindow,
  unwrapCheatSheet,
  getGroupTags,
  openTabs,
} from '../src_jq/common/commonFunctions'
import { cheatsheetsGroupByPreparedGroups } from '../src_jq/common/cheatSheetsManage'
import { getFilterByFilterTags } from '../src_jq/common/mulitselectTagsHandlers'

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
      cheatsheets: [],
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
        { title: 'Group' },
      ],
      selectVariants: [
        {
          title: 'All', // TODO: enter в поле поиска
          handler: () => {
            if (this.options.length === 0) {
              this.refresh()
              this.selectVariants.pop()
            }
          },
        },
        // {
        //   title: 'last created',
        //   handler: () => {
        //     this.refresh()
        //   },
        // },
        // {
        //   title: 'last searches', // TODO: вывывести в multilist список
        //   handler: () => {
        //     if (this.options.length === 0) { this.refresh() }
        //   },
        // },
        // {
        //   title: 'last edited',
        //   handler: () => {
        //     this.refresh()
        //   },
        // },
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
      if (request === 'to-add') {
        console.log("request === 'to-add'")
        setTimeout(() => {
          vm.addCheatSheet()
          vm.addMode = 'Tab'
        }, 10)
      }

      if (request === 'clear') {
        setTimeout(() => $('search .select2-search__field').focus(), 5)
      }
      sendResponse('success!')
    })
    let params = new URLSearchParams(window.location.search)

    if (params.get('cmd') === 'to-add') {
      console.log("params.get('cmd') === 'to-add'")

      setTimeout(() => {
        vm.addCheatSheet()
        vm.addMode = 'Tab'
      }, 10)
    }

    window.addEventListener(
      'keypress',
      (e) => {
        const activeElement = document.activeElement

        if (e.code === 'Escape') {
          setTimeout(() => $(activeElement).blur())
          return
        }

        if (
          activeElement.type === 'textarea'
          || activeElement.type === 'text'
          || $(activeElement).closest('.toastui-editor').length > 0
        ) {
          return
        }

        switch (e.key) {
          case 'f':
            setTimeout(
              () => $('search .select2-search__field').first().focus(),
              0,
            )
            break
          default:
            break
        }
      },
      false,
    )

    setTimeout(() => $('search .select2-search__field').focus(), 5)

    window.history.pushState({
      tags: '',
    }, null, '?tags=')

    window.onpopstate = function (event) {
      let tags = event.state.tags.split(',').map(el => ({ id: el, text: el }))

      vm.selected = tags
    }
  },
  computed: {
    groups() {
      let cheatsheets = this.searchResults
      let result = cheatsheetsGroupByPreparedGroups(cheatsheets)

      return reactive(result)
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

      return this.cheatsheets.filter(
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
          if (this.newCheatSheet) { this.newCheatSheet.link = '' }
          break
        case 'Group':
          break

        case 'Session':
          let windowId = await storage.get('windowId')
          getAllTabsByWindow(windowId).then((tabs) => {
            let date = new Date()

            let sessionTag = 'Session ' + date.toLocaleString().replace(',', '')
            this.newCheatSheet.tags.push(reactive({ id: sessionTag, text: sessionTag }))
            this.newCheatSheet.content = sessionTag
            this.newCheatSheet.type = 'group'

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
    searchTagsChange() {
      this.refresh()

      let tags = this.selected.map(el => el.text).join(',')
      if (window.history.state.tags !== tags) { window.history.pushState({ tags: tags }, null, '?tags=' + tags) }
    },
    tagsLoad() {
      if (this.options.length === 0) {
        this.smartotekaFabric
          .queriesProvider()
          .getTags()
          .then((tags) => {
            this.options = reactive(unique(
              tags.filter((el) => el),
              (el) => el.id,
            ))
          })
      }
    },
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

      if (this.newCheatSheet.tags.length > 0) {
        this.addMode = 'Group'
      }
    },
    saveNewCheatSheet(event) {
      let cheatsheet = event.cheatsheet
      switch (this.addMode) {
        case 'Group':
          cheatsheet.type = 'group'

          this.smartotekaFabric
            .KBManager()
            .addCheatSheet(cheatsheet)
            .then(() => {
              this.resetEditState()

              this.refresh()
            })
          break
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

          tabsToSave.unshift(cheatsheet)
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
          this.cheatsheets = reactive(cheatsheets)
        })
    },
    updateCheatSheet(event) {
      this.smartotekaFabric
        .KBManager()
        .updateCheatSheets([event.cheatsheet])
        .then(() => {
          if (event.tagsIsModified) { this.refresh() }
        })
    },
    removeCheatSheets(event) {
      if (confirm('Are you sure?')) {
        let group = event.group

        this.smartotekaFabric
          .KBManager()
          .deleteCheatSheets(event.cheatsheets)
          .then(() => {
            event.cheatsheets.forEach(ch => {
              group.items.splice(group.items.findIndex(item => ch.id === item.id), 1)
            })
            if (group.items.length === 0) { this.refresh() }
          })
      }
    },
    sessionTabsToGroup(event) {
      let tabsIds = event.ids
      let group = event.group
      let tags = getGroupTags(group)

      let cheatsheets = this.sesstionTabs
        .filter((el) => tabsIds.indexOf(el.id) >= 0)
        .map((el) => unwrapCheatSheet(el, tags))

      if (cheatsheets.length > 0) {
        this.smartotekaFabric
          .KBManager()
          .addCheatSheets(cheatsheets)
          .then(() => {
            cheatsheets.forEach((el) => group.items.push(reactive(el)))
          })
      }
    },
    dropCheatSheetsToGroup(event) {
      if (event.cheatsheets.length === 0) { return }

      let group = event.group
      let tags = getGroupTags(group)

      let isMove = event.event.dataTransfer.effectAllowed === 'move'

      let cheatsheets = event.cheatsheets
        .map((el) => unwrapCheatSheet(el,
          unique(isMove ? tags : tags.concat(el.tags), ch => ch.id)))

      this.smartotekaFabric
        .KBManager()
        .updateCheatSheets(cheatsheets)
        .then(() => {
          cheatsheets.forEach((el) => {
            el.group = group
            group.items.push(reactive(el))
          })
        })
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
    selectedSessionCheatSheet(event) {
      let cheatsheet = event
      this.lastSelected = cheatsheet.selected ? cheatsheet : null
    },
    selectedSessionFewCheatSheets(event) {
      let from = this.sesstionTabs.findIndex(el => el === this.lastSelected)
      if (from < 0) { from = 0 }
      let to = this.sesstionTabs.findIndex(el => el === event.cheatsheet)

      if (!event.event.ctrlKey) {
        this.sesstionTabs.forEach(el => el.selected = false)
      }

      let max = Math.max(from, to)
      for (let i = Math.min(from, to); i <= max; i++) {
        this.sesstionTabs[i].selected = true
      }
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
