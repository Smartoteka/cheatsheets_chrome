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
          :type="newCheatSheet.type"
          :cheatsheet="newCheatSheet"
          :allTags="options"
          v-on:update-cheatsheet="saveNewCheatSheet"
          v-on:cancel-edit="cancelNewCheatSheet"
          :mode="'add'"
        ></CheatSheet>
        <div ref="sessionTabClickContainer">
          <CheatSheet
            v-for="ch in sesstionTabs"
            :key="ch.id"
            :cheatsheet="ch"
            :readOnly="true"
            :showMode="'Markdown'"
            :clickContainer="this.$refs.sessionTabClickContainer"
            draggable="true"
            @dragstart="startSessionTabDrag($event, ch)"
            v-on:selected="selectedSessionCheatSheet($event)"
            v-on:selected-few-elements="selectedSessionFewCheatSheets($event)"
          ></CheatSheet>
        </div>
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
            :placeholder="'Click here and start typing to search'"
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
            :class="
              'pointer ' + (v.title == showMode ? 'selected' : 'unselected')
            "
          >
            {{ v.title }}
          </div>
        </div>
        <div style="margin-top: 10px">
          <!-- :showAll="
              (groups.length === 1 || searchResults.length < 4)
            " -->
          <div v-if="selected.length > 0 && groups.length === 0">
            No results found
          </div>
          <CheatSheetGroup
            ref="cheatSheetGroup"
            v-for="group in groups"
            :key="group.id"
            :group="group"
            :showChildren="groups.length <= 2"
            :allTags="options"
            :searchTags="selected"
            :showMode="showMode"
            v-on:update-cheatsheet="updateCheatSheet($event)"
            v-on:remove-cheatsheets="removeCheatSheets($event)"
            v-on:move-to-tags="moveToTags($event)"
            v-on:drop-session-tabs-to-group="sessionTabsToGroup($event)"
            v-on:drop-cheat-sheets-in-group="dropCheatSheetsInGroup($event)"
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
import {
  cheatsheetsGroupByPreparedGroups,
  findTagsInOrderedTags,
  sortSternBroko,
  moveCheatSheets,
  hashCode,
  buildSternBrokkoTree,
} from '../src_jq/common/cheatSheetsManage'
import { comparerFunc } from '../src_jq/common/rateTags'

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
      default: true,
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
      showMode: 'Contents',
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
          title: 'Contents',
          handler: () => {
            this.showMode = 'Contents'
            this.refresh()
          },
        },
        {
          title: 'Markdown',
          handler: () => {
            this.showMode = 'Markdown'
            this.refresh()
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
  beforeMount() {
    let vm = this
    let params = new URLSearchParams(window.location.search)

    if (params.get('cmd') === 'to-add') {
      console.log("params.get('cmd') === 'to-add'")

      setTimeout(() => {
        vm.addCheatSheet()
        vm.addMode = 'Tab'
      }, 10)
    }

    let tags = params.get('tags')
    if (tags) {
      this.tagsLoad().then(() => {
        let splittedTags = tags.split(',')
        this.selected = this.options.filter(
          (o) => splittedTags.indexOf(o.text) >= 0,
        )
      })
    }

    window.history.pushState(
      {
        tags: tags,
      },
      null,
      '?tags=' + tags,
    )

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
    window.onpopstate = function (event) {
      vm.selected = event.state.tags
        .split(',')
        .map((el) => ({ id: el, text: el }))
    }
  },
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

    setTimeout(() => $('search .select2-search__field').focus(), 5)
  },
  computed: {
    groups() {
      let cheatsheets = this.searchResults
      let result = cheatsheetsGroupByPreparedGroups(
        cheatsheets,
        this.selected.length,
      )

      return reactive(result)
    },
    searchResults() {
      if (this.cheatsheets.length === 0) {
        return []
      }

      if (this.selected.length > 0 && this.selected[this.selected.length - 1].text.startsWith('+')) {
        let cmd = this.selected.pop().text

        let vm = this
        this.$nextTick(() => {
          switch (cmd) {
            case '+go':
              vm.$refs.cheatSheetGroup.openTabs()
              break
            case '+c':
              vm.$refs.cheatSheetGroup.closeTabsByUrlIfOpen()
              break
            case '+co':
              vm.$refs.cheatSheetGroup.closeOthers()
              break
            case '+nw':
              vm.$refs.cheatSheetGroup.openTabsInNewWindow()
              break
            default:
              throw new Error('Unexpected command ' + cmd)
          }
        })
      }

      let tags = this.selected.map((el) => el.text).join(',')
      if (window.history.state && window.history.state.tags !== tags) {
        window.history.pushState({ tags: tags }, null, '?tags=' + tags)
      }

      let findTags = this.selected
        .map((el) => parseInt(el.id, 10))
        .sort(comparerFunc((el) => el))
      console.log('searchResults ' + tags)
      return this.cheatsheets.filter(
        (cheatsheet) => !cheatsheet.orderedTags
          || findTagsInOrderedTags(findTags, cheatsheet.orderedTags),
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
          if (this.newCheatSheet) {
            this.newCheatSheet.link = ''
            this.newCheatSheet.type = 'cheatsheet'
            this.newCheatSheet.tags = this.newCheatSheet.tags.filter(
              (el) => !el.sessionTag,
            )
          }
          break
        case 'Group':
          this.newCheatSheet.type = 'group'
          this.newCheatSheet.tags = this.newCheatSheet.tags.filter(
            (el) => !el.sessionTag,
          )
          break

        case 'Session':
          let windowId = await storage.get('windowId')
          getAllTabsByWindow(windowId).then((tabs) => {
            let date = new Date()

            let sessionTag = 'Session'
            let timetag = date.toLocaleString().replace(',', '')
            this.newCheatSheet.tags.push(
              reactive({
                id: hashCode(sessionTag),
                text: sessionTag,
                sessionTag: true,
              }),
            )
            this.newCheatSheet.tags.push(
              reactive({
                id: hashCode(timetag),
                text: timetag,
                sessionTag: true,
              }),
            )
            // this.newCheatSheet.content = ''
            this.newCheatSheet.type = 'group'

            let i = 0
            this.sesstionTabs = tabs.map((tab) => {
              i += 1
              return {
                id: parseInt(date.getTime() + '' + i, 10),
                date: date,
                type: 'cheatsheet',
                content: this.tabLinkMarkdown(tab),
                tags: [],
                link: tab.url,
              }
            })

            let sessionCheatSheets = [this.newCheatSheet].concat(
              this.sesstionTabs,
            )
            buildSternBrokkoTree(
              sessionCheatSheets,
              -1,
              sessionCheatSheets.length,
            )
          })
          break
        case 'Tab':
          this.newCheatSheet.type = 'cheatsheet'
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
      // if (this.cheatsheets.length === 0) {
      this.refresh()
      //   }
    },
    tagsLoad() {
      return this.smartotekaFabric
        .queriesProvider()
        .getTags()
        .then((tags, changed) => {
          if (this.options.length === 0 || changed) {
            let selected = this.selected
            this.options = unique(
              tags.filter((el) => el),
              (el) => el.id,
            ).map((el) => ({ id: el.uid, text: el.text }))

            this.selected = selected
          }
        })
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
        markdown
          += '<img align="left" width="16 px" src="'
          + tab.favIconUrl
          + '" />&nbsp;'
      }
      markdown += '[' + tab.title + '](' + tab.url + ')'

      return markdown
    },
    moveToTags(event) {
      if (event.event.ctrlKey) {
        openTabs([
          {
            url:
              '../cheatsheets/page.html?tags='
              + event.tags.map((el) => el.text).join(','),
          },
        ])
      } else {
        this.selected = event.tags
      }
    },
    addCheatSheet() {
      let date = new Date().valueOf()
      this.newCheatSheet = {
        id: date,
        type: 'cheatsheet',
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
          buildSternBrokkoTree([cheatsheet], -1, 1)
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
          buildSternBrokkoTree([cheatsheet], -1, 1)
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

          buildSternBrokkoTree(tabsToSave, -1, tabsToSave.length)
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
      console.log('cheatsheets refresh')
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
          if (event.tagsIsModified) {
            this.refresh()
          }
        })
    },
    removeCheatSheets(event) {
      if (confirm('Are you sure?')) {
        let group = event.group

        this.smartotekaFabric
          .KBManager()
          .deleteCheatSheets(event.cheatsheets)
          .then(() => {
            event.cheatsheets.forEach((ch) => {
              group.items.splice(
                group.items.findIndex((item) => ch.id === item.id),
                1,
              )
            })
            if (group.items.length === 0) {
              this.refresh()
            }
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
    dropCheatSheetsInGroup(event) {
      const cheatsheets = event.cheatsheets
      if (cheatsheets.length === 0) {
        return
      }

      let group = event.group
      const array = group.items
      // let tags = getGroupTags(group)

      // let isMove = event.event.dataTransfer.effectAllowed === 'move'

      moveCheatSheets(array, event.to, cheatsheets)

      this.smartotekaFabric
        .KBManager()
        .updateCheatSheets(cheatsheets)
        .then(() => {
          cheatsheets.forEach((ch) => {
            let index = group.items.findIndex((item) => item.id === ch.id)
            group.items[index].d = ch.d
            group.items[index].n = ch.n
          })
          group.items = reactive(sortSternBroko(group.items))
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
      let from = this.sesstionTabs.findIndex((el) => el === this.lastSelected)
      if (from < 0) {
        from = 0
      }
      let to = this.sesstionTabs.findIndex((el) => el === event.cheatsheet)

      if (!event.event.ctrlKey) {
        this.sesstionTabs.forEach((el) => (el.selected = false))
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
.selectElementInLine {
  display: flex;
  flex-direction: row;
  column-gap: 10px;

  div {
    line-height: 2em;
    padding: 5px 5px;
  }
  div.selected {
    border: 2px solid #bbfdc6;
    border-radius: 5px;
  }
}
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

.pointer {
  cursor: pointer;
}
</style>
