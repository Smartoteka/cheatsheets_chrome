<template>
  <div>
    <div
      :class="'group ' + (isContainsLink ? 'link' : 'info')"
      @contextmenu="onHeaderContextMenu($event)"
    >
      <!-- @click.self="showChildren = !showChildren" -->
      <div
        class="header"
        @mouseenter="mouseFocus = true"
        @mouseleave="mouseFocus = false"
      >
        <!-- <div class="title">
          <span
            class="tag"
            v-for="tag in tags"
            :key="tag.id"
            @click="moveToTags(tag.id)"
            >{{ tag.text }}&nbsp;
          </span>
          <img
            class="expand ctrl-img"
            :style="mouseFocus ? '' : 'visibility:hidden'"
            :src="
              showChildren ? '/images/arrow-up.svg' : '/images/arrow-down.svg'
            "
            @click.self="showChildren = !showChildren"
          />
        </div> -->
        <!-- v-if="mouseFocus && menuElements.length > 0" -->
        <Menu
          v-if="mouseFocus && menuElements.length > 0"
          :elements="menuElements"
        >
        </Menu>
        <!-- <img class="add" src="/images/plus-square.svg" @click="addCheatSheet" /> -->
        <!-- v-if="group.items.findIndex((el) => el.isNew) < 0" -->
      </div>
      <!-- group.items.slice(0, 2) -->
      <div class="content">
        <div class="row" ref="groupClickContainer">
          <CheatSheet
            v-for="cheatsheet in showChildren ? group.items : []"
            :key="cheatsheet.id"
            :cheatsheet="cheatsheet"
            :commonTags="searchTags"
            :options="options"
            :showMode="showMode"
            :clickContainer="this.$refs.groupClickContainer"
            v-on:selected="selectedCheatSheet($event)"
            v-on:selected-few-elements="selectedFewCheatSheets($event)"
            v-on:update-cheatsheet="$emit('update-cheatsheet', $event)"
            v-on:remove-cheatsheets="
              $emit('remove-cheatsheets', {
                group: this.group,
                cheatsheets: $event,
              })
            "
            v-on:move-to-tags="$emit('move-to-tags', $event)"
            draggable="true"
            @dragstart="startCheatSheetDrag($event, cheatsheet)"
            v-on:drop-session-tabs-to-group="
              $event.group = this.group;
              $emit('drop-session-tabs-to-group', $event);
            "
            v-on:drop-cheat-sheets-in-group="
              $event.group = this.group;
              $emit('drop-cheat-sheets-in-group', $event);
            "
          ></CheatSheet>
        </div>
        <!-- <div class="row" v-if="group.groups.length > 0 && showChildren">
          <div class="column">
            <img class="ctrl-img" src="/images/corner-down-right.svg" />
          </div>
          <div class="column2">
            <CheatSheetGroup
              :level="level + 1"
              v-for="group in group.groups"
              :key="group.id"
              :group="group"
              :showAll="showAll"
              :showChildren="showAll"
              :options="options"
              v-on:update-cheatsheet="$emit('update-cheatsheet', $event)"
              v-on:remove-cheatsheets="$emit('remove-cheatsheets', $event)"
              v-on:move-to-tags="$emit('move-to-tags', $event)"
            ></CheatSheetGroup>
          </div>
        </div> -->
      </div>
    </div>
  </div>
</template>

<script>
import { takeWhile } from 'lodash'
import CheatSheet from './CheatSheet'
import Menu from './menuText'
import {
  openTabsInNewWindow,
  openTabs,
  closeTabsByUrlIfOpen,
  getGroupTags,
  getAllTabs,
  closeTabs,
  unwrapCheatSheet,
} from '../../src_jq/common/commonFunctions'

export default {
  name: 'CheatSheetGroup',
  emits: [
    'update-cheatsheet',
    'remove-cheatsheets',
    'move-to-tags',
    'drop-cheat-sheets-in-group',
    'drop-session-tabs-to-group',
  ],
  components: {
    CheatSheet,
    Menu,
  },
  props: {
    showMode: String,
    group: {
      type: Object,
      default: () => {},
    },
    searchTags: {
      type: Array,
      default: () => [],
    },
    showChildren: {
      type: Boolean,
      default: () => false,
    },
    showAll: {
      type: Boolean,
      default: () => false,
    },
    options: {
      type: Function,
      default: () => () => [],
    },
    level: {
      type: Number,
      default: () => 0,
    },
  },
  data() {
    return {
      mouseFocus: false,
      lastSelected: null,
    }
  },
  computed: {
    menuElements() {
      let menuItems = []

      if (this.isContainsLink) {
        let that = this
        menuItems = menuItems.concat([
          {
            text: 'Open in current window',
            handler: () => {
              that.openTabs()
            },
          },
          {
            text: 'Open in new window',
            handler: () => {
              that.openTabsInNewWindow()
            },
          },
          {
            text: 'Close all and dublicates',
            handler: function () {
              that.closeTabsByUrlIfOpen()
            },
          },
          {
            text: 'Close others',
            handler: function () {
              that.closeOthers()
            },
          },
        ])
      }

      if (this.isContainsSelected) {
        let that = this
        menuItems = menuItems.concat([
          {
            text: 'Remove selected',
            handler: () => {
              let cheatsheets = that.getSelected()

              that.$emit('remove-cheatsheets', {
                group: this.group,
                cheatsheets,
              })
            },
          },
        ])
      }

      menuItems.push({
        text: 'Delete group',
        handler: () => {
          this.$emit('remove-cheatsheets', {
            group: this.group,
            cheatsheets: this.group.items.filter(
              (el) => el.self && el.self.id === this.group.id,
            ),
          })
        },
      })
      return menuItems
    },
    isContainsLink() {
      return this.group.items.findIndex((el) => el.link) >= 0
    },
    isContainsSelected() {
      return this.group.items.findIndex((el) => el.selected) >= 0
    },
    tags() {
      return getGroupTags(this.group)
    },
  },
  methods: {
    openTabs(options) {
      let tabs = this.getTabs()
      if (options && options.first) {
        tabs = tabs.splice(0, 1)
      }
      openTabs(tabs)
    },
    openTabsInNewWindow() {
      let tabs = this.getTabs()
      openTabsInNewWindow(tabs)
    },
    closeTabsByUrlIfOpen() {
      let tabs = this.getTabs()
      closeTabsByUrlIfOpen(tabs)
    },
    closeOthers() {
      let currentTabs = this.getTabs()

      getAllTabs().then((tabs) => {
        let otherTabs = tabs.filter(
          (tab) => currentTabs.findIndex((st) => st.url === tab.url) === -1,
        )

        closeTabs(otherTabs)
      })
    },
    startCheatSheetDrag(event, item) {
      let cheatsheets = item.selected
        ? this.group.items
          .filter((el) => el.selected)
          .map((el) => unwrapCheatSheet(el, el.tags))
        : [unwrapCheatSheet(item, item.tags)]
      const cmdType = event.ctrlKey ? 'copy' : 'move'
      event.dataTransfer.dropEffect = cmdType
      event.dataTransfer.effectAllowed = cmdType
      event.dataTransfer.setData(
        'data',
        JSON.stringify({ cheatsheets: cheatsheets, type: 'moveCheatSheets' }),
      )
    },
    getSelected() {
      return this.group.items.filter((el) => el.selected)
    },
    getTabs() {
      let items = this.group.items
      items = this.isContainsSelected ? this.getSelected() : items

      return items.filter((el) => el.link).map((el) => ({ url: el.link }))
    },
    moveToTags(tagId) {
      let flag = true
      let tags = takeWhile(this.tags, (el) => {
        let prevValue = flag
        flag = el.id !== tagId

        return prevValue
      })

      this.$emit('move-to-tags', tags)
    },
    onHeaderContextMenu(e) {
      if (e.handle) {
        return
      }
      e.preventDefault()

      let items = this.menuElements.map((el) => ({
        label: el.text,
        onClick: el.handler,
      }))

      // shou our menu
      this.$contextmenu({
        x: e.pageX,
        y: e.pageY,
        items: items,
      })
    },
    selectedCheatSheet(event) {
      let cheatsheet = event
      this.lastSelected = cheatsheet.selected ? cheatsheet : null
    },
    selectedFewCheatSheets(event) {
      let from = this.group.items.findIndex((el) => el === this.lastSelected)
      if (from < 0) {
        from = 0
      }
      let to = this.group.items.findIndex((el) => el === event.cheatsheet)

      if (!event.event.ctrlKey) {
        this.group.items.forEach((el) => (el.selected = false))
      }

      let max = Math.max(from, to)
      for (let i = Math.min(from, to); i <= max; i++) {
        this.group.items[i].selected = true
      }
    },
  },
}
</script>

<style lang="scss" scoped>
@import "../../styles/variables";

$sky: #8ef7a0;

.content {
  margin-left: 15px;

  // .column {
  //   float: left;
  //   display: inline;
  // }
  // .column2 {
  //   display: inline;
  //   float: left;
  //   width: 100%;
  // }
}

.ctrl-img {
  width: 16px;
}

.group.info {
  border: 2px solid #bbfdc6;
}

.group.link {
  border: 2px solid #e6f6fe;
}

.header {
  height: 15px;
}
// .group {
//   padding-top: 10px;
//   padding-bottom: 10px;
//   clear: both;

//   .header {
//     position: relative;
//     font-size: 1.125rem;
//     padding: 0 1rem;
//     line-height: 1.125rem;
//     display: flex;
//     justify-content: space-between;
//     align-items: center;

//     .title {
//       min-height: 1.5rem;
//       line-height: 1.5rem;
//       vertical-align: middle;
//       font-weight: 500;
//       color: #194c66;

//       .expand {
//         display: inline-block;
//         cursor: pointer;
//         margin-right: 20px;
//       }

//       .tag {
//         cursor: pointer;
//       }
//     }
//   }
// }
</style>
