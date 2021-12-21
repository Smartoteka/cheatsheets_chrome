<template>
  <div>
    <div
      :class="'card ' + (isContainsLink ? 'link' : 'info')"
      @drop="onDrop($event)"
      @dragleave="dragLeave($event)"
      @dragover="dragOver($event)"
    >
      <div
        class="header"
        @mouseenter="mouseFocus = true"
        @mouseleave="mouseFocus = false"
      >
        <div class="title">
          <span
            class="tag"
            v-for="tag in tags"
            :key="tag.id"
            @click="moveToTags(tag.id)"
            >{{ tag.text }}&nbsp;
          </span>
          <img
            class="expand ctrl-img"
            :style="mouseFocus?'':'visibility:hidden'"
            :src="showChildren?'/images/arrow-up.svg':'/images/arrow-down.svg'"
            @click.self="showChildren = !showChildren"
          />
        </div>
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
        <div class="row">
          <div
            v-for="cheatsheet in showChildren ? group.items : []"
            :key="cheatsheet.id"
          >
            <!-- v-if="cheatsheet.type === 'cheatsheet'" -->
            <CheatSheet
              :cheatsheet="cheatsheet"
              :commonTagsCount="group.commonTagsCount"
              :allTags="allTags"
              v-on:update-cheatsheet="$emit('update-cheatsheet', $event)"
              v-on:remove-cheatsheets="$emit('remove-cheatsheets', $event)"
              v-on:move-to-tags="$emit('move-to-tags', $event)"
              draggable="true"
              @dragstart="startCheatSheetDrag($event, cheatsheet)"
            ></CheatSheet>
          </div>
        </div>
        <div class="row" v-if="group.groups.length > 0 && showChildren">
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
              :allTags="allTags"
              v-on:update-cheatsheet="$emit('update-cheatsheet', $event)"
              v-on:remove-cheatsheets="$emit('remove-cheatsheets', $event)"
              v-on:move-to-tags="$emit('move-to-tags', $event)"
            ></CheatSheetGroup>
          </div>
        </div>
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
} from '@/src_jq/common/commonFunctions'

export default {
  name: 'CheatSheetGroup',
  emits: [
    'update-cheatsheet',
    'remove-cheatsheets',
    'move-to-tags',
    'drop-cheatsheet-to-group',
  ],
  components: {
    CheatSheet,
    Menu,
  },
  props: {
    group: {
      type: Object,
      default: () => {},
    },
    showChildren: {
      type: Boolean,
      default: () => false,
    },
    showAll: {
      type: Boolean,
      default: () => false,
    },
    allTags: {
      type: Array,
      default: () => [],
    },
    level: {
      type: Number,
      default: () => 0,
    },
  },
  data() {
    return {
      mouseFocus: false,
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
              let tabs = that.getTabs()
              openTabs(tabs)
            },
          },
          {
            text: 'Open in new window',
            handler: () => {
              let tabs = that.getTabs()
              openTabsInNewWindow(tabs)
            },
          },
          {
            text: 'Close all and dublicates',
            handler: function () {
              let tabs = that.getTabs()
              closeTabsByUrlIfOpen(tabs)
            },
          },
          {
            text: 'Close others',
            handler: function () {
              let currentTabs = that.getTabs()

              getAllTabs()
                .then((tabs) => {
                  let otherTabs = tabs.filter(tab => currentTabs.findIndex(st => st.url === tab.url) === -1)

                  closeTabs(otherTabs)
                })
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

              that.$emit('remove-cheatsheets', cheatsheets)
            },
          },
        ])
      }

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
    // isManyChildren() {
    //   return this.group.items.length > 0 || this.group.groups.length > 0
    // },
  },
  methods: {
    startCheatSheetDrag(evt, item) {
      let cheatsheets = item.selected
        ? this.items.filter((el) => el.selected)
        : [item]
      evt.dataTransfer.dropEffect = 'move'
      evt.dataTransfer.effectAllowed = 'move'
      evt.dataTransfer.setData('data', JSON.stringify({ cheatsheets: cheatsheets, type: 'moveCheatSheets' }))
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
    dragOver(event) {
      event.preventDefault()
    },
    dragLeave(event) {
      event.preventDefault()
      event.stopPropagation()
    },
    onDrop(evt) {
      const dataStr = evt.dataTransfer.getData('data')
      let data = JSON.parse(dataStr)

      switch (data.type) {
        case 'sessionTabs':
          this.$emit('drop-session-tabs-to-group', {
            ids: data.ids,
            group: this.group,
          })
          break
        case 'moveCheatSheets':
          this.$emit('drop-cheat-sheets-to-group', {
            cheatsheets: data.cheatsheets,
            group: this.group,
          })
          break
        default:
          throw new Error('Unexpected type of drop ' + data.type)
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

  .column {
    float: left;
    display: inline;
  }
  .column2 {
    display: inline;
    float: left;
    width: 100%;
  }
}

.ctrl-img {
  width: 16px;
}

.info {
  border: 2px solid #bbfdc6;
}

.link {
  border: 2px solid #e6f6fe;
}

.card {
  padding-top: 10px;
  padding-bottom: 10px;
  clear: both;

  .header {
    position: relative;
    font-size: 1.125rem;
    padding: 0 1rem;
    line-height: 1.125rem;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      min-height: 1.5rem;
      line-height: 1.5rem;
      vertical-align: middle;
      font-weight: 500;
      color: #194c66;

      .expand {
        display: inline-block;
        cursor: pointer;
        margin-right: 20px;
      }

      .tag {
        cursor: pointer;
      }
    }
  }
}
</style>
