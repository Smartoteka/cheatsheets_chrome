<template>
  <div
   @drop="onDrop($event)"
      @dragleave="dragLeave($event)"
      @dragover="dragOver($event)"
    :class="
      'cheatsheet ' +
      (cheatsheet.link ? 'link' : 'info') +
      (cheatsheet.selected || mouseFocus || isNotRead ? ' selected' : '')
    "
    @click="selectChange($event)"
    v-click-outside="clickOutside"
    @contextmenu="onContextMenu($event)"
    @mouseenter="mouseFocus = true"
    @mouseleave="mouseFocus = false"
  >
    <div class="selectElementInLine" v-if="currentMode === 'edit'">
      <div
        v-for="(name, key) in types"
        :key="key"
        @click="editType = key"
        :class="'pointer ' + (key === editType ? 'selected' : 'unselected')"
      >
        {{ name }}
      </div>
    </div>
    <p :class="'tags ' + (isNotRead ? 'hide' : '')">
      <span v-if="cheatsheet.type === 'group' && tags.length > 0"
        ><img
          class="add ctrl-img"
          style="width: 15px; height: 15px; margin-right: 5px"
          src="/images/arrow-down.svg"
          @click="
            moveToTags(
              tags.length > 0 ? tags[tags.length - 1].text : '',
              $event
            )
          "
      /></span>
      <span
        v-for="tag in tags"
        :key="tag.id"
        @click="moveToTags(tag.text, $event)"
        >{{ tag.text }}&nbsp;&nbsp;</span
      >
    </p>
    <p v-if="isNotRead">
      <select2
        :options="options"
        v-model="editTags"
        :placeholder="'Enumerate the tags to search for this element'"
      >
      </select2>
    </p>
    <Editor ref="editor" v-if="isNotRead" :initialValue="cheatsheet.content" />

    <p
      :style="
        'font-size: 20px; padding-top: 5px; margin: 3px 3px;' +
        'display:' +
        (cheatsheet.selected || showMode === 'Markdown' ? 'none' : 'block')
      "
    >
      {{ $filters.truncate(content, truncateHeaderWidth, "...") }}
    </p>
    <Viewer
      v-if="!isNotRead && (cheatsheet.selected || showMode === 'Markdown')"
      :initialValue="content"
      v-on:rendered="allAnchorOpenInNewTag($event)"
    />

    <div class="edit-buttons" v-if="isNotRead">
      <span
        class="label"
        :style="
          'visibility:' + (isNotRead && !hideContent ? 'visible' : 'hidden')
        "
        >Link:</span
      >
      <input
        :style="
          'visibility:' + (isNotRead && !hideContent ? 'visible' : 'hidden')
        "
        v-model="cheatsheet.link"
        class="
          w-full
          px-4
          py-2
          mt-2
          border
          rounded-md
          focus:outline-none focus:ring-1 focus:ring-blue-600
        "
      />
      <img src="/images/save.svg" class="save" @click="save" />
      <img src="/images/x.svg" class="close" @click="cancel" />
    </div>
    <!-- v-if="mouseFocus && !isNotRead && !readOnly" -->
    <Menu
      v-if="mouseFocus && !isNotRead && !readOnly"
      :elements="menuElements"
      :textElements="textMenuElements"
    >
    </Menu>
  </div>
</template>

<script>
import '@toast-ui/editor/dist/toastui-editor.css' // Editor's Style

import { takeWhile } from 'lodash'
import Viewer from './Viewer'
import Editor from './Editor'
import Select2 from '../../common/Select2'
import ClickOutsideEvent from '../../common/directives/ClickOutside'
import {
  unwrapCheatSheet,
  closeTabsByUrlIfOpen,
  openTabsInNewWindow,
  openTabs,
  unique,
  arraysIsEqual,
  getSmartotekaFabric,
} from '../../src_jq/common/commonFunctions'
import Menu from './menu'

export default {
  name: 'CheatSheet',
  emits: [
    'move-to-tags',
    'cancel-edit',
    'remove-cheatsheets',
    'selected-few-elements',
    'selected',
    'drop-cheat-sheets-in-group',
    'drop-session-tabs-to-group',
  ],
  components: {
    Select2,
    Editor,
    Viewer,
    Menu,
  },
  directives: {
    'click-outside': ClickOutsideEvent,
  },
  props: {
    clickContainer: Object,
    showMode: {
      type: String,
    },
    cheatsheet: {
      type: Object,
      default: () => {},
    },
    commonTags: {
      type: Array,
      default: () => [],
    },
    // allTags: {
    //   type: Array,
    //   default: () => [],
    // },
    mode: {
      type: String,
      defautl: () => 'read',
      writable: true,
    },
    readOnly: {
      type: Boolean,
      defautl: () => false,
      writable: true,
    },
    hideContent: {
      type: Boolean,
      defautl: () => false,
      writable: true,
    },
    popup: {
      type: Boolean,
      defautl: () => false,
      writable: true,
    },
    type: {
      type: String,
      defautl: () => null,
      writable: true,
    },
  },
  data() {
    return {
      options: [],
      editTags: [],
      truncateHeaderWidth: 40,
      editType: 'cheatsheet',
      editorOptions: {
        usageStatistics: false,
      },
      mouseFocus: false,
      currentMode: 'read',
      menuElements: [
        {
          image: '/images/edit.svg',
          handler: () => this.toEditMode(),
        },
        {
          image: '/images/trash.svg',
          handler: () => this.removeCheatSheet(),
        },
      ],
      types: { cheatsheet: 'Cheat Sheet', group: 'Group' },
    }
  },
  beforeMount: function () {
    this.currentMode = this.mode
    this.editType = this.cheatsheet.type
  },
  mounted: function () {
    this.addButtonsToCodeBlocks()

    let getTruncateWidth = () => (window.innerWidth < 600
      ? 40
      : window.innerWidth < 700
        ? 55
        : window.innerWidth < 800
          ? 60
          : window.innerWidth < 1000
            ? 70
            : 80)
    this.truncateHeaderWidth = getTruncateWidth()

    window.addEventListener('resize', () => {
      this.truncateHeaderWidth = getTruncateWidth()
    })
  },
  updated: function () {
    if (!this.isNotRead) {
      this.addButtonsToCodeBlocks()
    }
  },
  computed: {
    smartotekaFabric() {
      return getSmartotekaFabric()
    },
    isNotRead() {
      return this.currentMode === 'add' || this.currentMode === 'edit'
    },
    textMenuElements() {
      let menuItems = []

      if (this.cheatsheet.link) {
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
            text: 'Close',
            handler: function () {
              let tabs = that.getTabs()
              closeTabsByUrlIfOpen(tabs)
            },
          },
        ])
      }

      return menuItems
    },
    tags() {
      this.updateEditTags(true)

      return this.cheatsheet.tags.filter(
        (t) => !(
          this.commonTags
            && this.commonTags.length > 0
            && this.commonTags.findIndex((ct) => t.uid == ct.id) >= 0
        ),
      )
    },
    content() {
      return this.cheatsheet.content
    },
  },
  watch: {
    currentMode(value) {
      if (value) {
        this.tagsLoad().then(() => this.updateEditTags())
      }
    },
    type(value) {
      this.editType = value
    },
  },
  methods: {
    dragOver(event) {
      event.preventDefault()
    },
    dragLeave(event) {
      event.preventDefault()
      event.stopPropagation()
    },
    onDrop(event) {
      const dataStr = event.dataTransfer.getData('data')
      let data = JSON.parse(dataStr)

      switch (data.type) {
        case 'sessionTabs':
          this.$emit('drop-session-tabs-to-group', {
            event: event,
            ids: data.ids,
          })
          break
        case 'moveCheatSheets':
          this.$emit('drop-cheat-sheets-in-group', {
            event: event,
            cheatsheets: data.cheatsheets,
            to: this.cheatsheet,
          })
          break
        default:
          throw new Error('Unexpected type of drop ' + data.type)
      }
    },
    tagsLoad() {
      return this.smartotekaFabric
        .queriesProvider()
        .getTags()
        .then((tags, changed) => {
          if (this.options.length === 0 || changed) {
            let selectedTags = this.editTags
            this.options = unique(
              tags.filter((el) => el),
              (el) => el.id,
            ).map((el) => ({ id: el.uid, text: el.text }))

            this.editTags = selectedTags
          }
        })
    },
    getTabs() {
      return [{ url: this.cheatsheet.link }]
    },
    clickOutside(event) {
      if (this.cheatsheet.selected) {
        console.log('outside!')
        if (
          (!this.clickContainer || this.clickContainer.contains(event.target))
          && !(
            event.ctrlKey
            || event.shiftKey
            || (event.target.parentElement
              && (event.target.parentElement.classList.contains('dropdown')
                || event.target.parentElement.classList.contains('menu')))
          )
        ) {
          this.cheatsheet.selected = false
        }
      }
    },
    selectChange(event) {
      if (this.isNotRead) {
        return
      }

      if (event.shiftKey) {
        this.$emit('selected-few-elements', {
          event,
          cheatsheet: this.cheatsheet,
        })
      } else {
        this.cheatsheet.selected = !this.cheatsheet.selected
        this.$emit('selected', this.cheatsheet)
      }
    },
    getTagsUntilPosition(tagId) {
      let flag = true
      let tags = (this.commonTags || []).concat(
        takeWhile(this.cheatsheet.tags, (el) => {
          let prevValue = flag
          flag = el.id !== tagId

          return prevValue
        }).map((el) => ({ id: el.uid, text: el.text })),
      )

      return tags
    },
    moveToTags(tagId, event) {
      let tags = this.getTagsUntilPosition(tagId)

      this.$emit('move-to-tags', {
        tags: tags,
        event: event,
      })
    },
    addButtonsToCodeBlocks() {
      let vm = this

      const toRemove = this.$el.querySelector('code .copy')
      if (toRemove) { toRemove.parentNode.removeChild(toRemove) }
      let codeEls = this.$el.querySelectorAll('code')

      codeEls.forEach(codeEl => {
        codeEl.innerHTML += (
          '<img class="copy" style="display:none" src="/images/copy.svg" data-v-2d0b1742="">'
        )
        codeEl.style.position = 'relative'

        codeEl.addEventListener('mouseleave', function () {
          let that = this

          let hideWithTimeout = () => {
            if (that.querySelector('img').classList.contains('focus')) {
              setTimeout(hideWithTimeout, 200)
            } else {
              that.querySelector('img').style.display = 'none'
            }
          }

          setTimeout(hideWithTimeout, 200)
        })

        codeEl.addEventListener('contextmenu', function (e) {
          if (e.handle) {
            return
          }
          e.preventDefault()

          let items = []
          items.push({
            label: 'Copy',
            onClick: () => {
              let text = e.target.closest('.toastui-editor-contents').text()
              navigator.clipboard.writeText(text)
            },
          })

          vm.$contextmenu({
            x: e.pageX,
            y: e.pageY,
            items: items,
          })

          e.originalEvent.handle = true
        })

        codeEl.addEventListener('mouseenter', function () {
          this.querySelector('img').style.display = 'block'
        })

        const imgCopy = codeEl.querySelector('img.copy')

        if (imgCopy) {
          imgCopy.addEventListener('mouseleave', function (e) {
            this.classList.remove('focus')
          })
          imgCopy.addEventListener('mouseenter', function (e) {
            this.classList.add('focus')
          })
          imgCopy.addEventListener('click', function (e) {
            e.stopPropagation()

            this.style.backgroundColor = '#bbfdc6'
            let text = this.parentElement.textContent

            if (!navigator.clipboard) {
              fallbackCopyTextToClipboard(text)
              return
            }
            navigator.clipboard.writeText(text).then(
              function () {
                console.log('Async: Copying to clipboard was successful!')
              },
              function (err) {
                console.error('Async: Could not copy text: ', err)
              },
            )
          })
        }
      })
    },
    updateEditTags(concat) {
      if (!this.isNotRead) { return }

      if (concat && this.prevTags) {
        let addedTags = this.cheatsheet.tags.filter(ch => this.prevTags.findIndex(pch => pch.id == ch.id) < 0)

        this.editTags = unique(this.editTags.slice(0).concat(addedTags), el => el.id)

        let removed = this.prevTags.filter(pch => this.cheatsheet.tags.findIndex(ch => pch.id == ch.id) < 0)

        this.editTags = this.editTags.filter(et => removed.findIndex(r => et.id == r.id) < 0)
      } else { this.editTags = this.cheatsheet.tags.slice(0) }
      this.prevTags = this.cheatsheet.tags.slice(0)
    },
    toEditMode() {
      this.currentMode = 'edit'
    },
    removeCheatSheet() {
      this.$emit('remove-cheatsheets', [this.cheatsheet])
    },
    save() {
      this.currentMode = 'read'
      this.mouseFocus = false

      let tagsIsModified = !arraysIsEqual(
        this.editTags,
        this.cheatsheet.tags,
        (el) => el.text,
      )

      if (tagsIsModified) {
        this.cheatsheet.tags = unique(
          this.editTags.slice(0),
          (el) => el.id,
        ).map((t) => ({
          id: t.text,
          text: t.text,
          uid: parseInt(t.id, 10),
        }))
      }

      if (this.$refs.editor) {
        this.cheatsheet.content = this.$refs.editor.editor.getMarkdown()
      }

      this.cheatsheet.type = this.editType
      let saveCheatSheet = unwrapCheatSheet(this.cheatsheet, this.editTags)

      let newTags = this.editTags.filter((el) => el.newTag)

      this.smartotekaFabric.KBManager().addTags(newTags)

      this.$emit('update-cheatsheet', {
        cheatsheet: saveCheatSheet,
        tagsIsModified,
      })
    },
    cancel() {
      this.currentMode = 'read'
      this.mouseFocus = false
      this.updateEditTags()
      this.$emit('cancel-edit')
    },
    copyContent() {
      let text = this.cheatsheet.content
      navigator.clipboard.writeText(text).then(
        function () {
          console.log('Async: Copying to clipboard was successful!')
        },
        function (err) {
          console.error('Async: Could not copy text: ', err)
        },
      )
    },
    onContextMenu(e) {
      if (e.handle) {
        return
      }
      if (e.target.closest('.toastui-editor') !== null) {
        return
      }
      // prevent the browser's default menu
      e.preventDefault()

      let items = []

      if (this.cheatsheet.content) {
        items.push({
          label: 'Copy text',
          onClick: () => {
            let text = e.target.closest('.toastui-editor-contents').text()
            navigator.clipboard.writeText(text)
          },
        })
        items.push({
          label: 'Copy markdown',
          onClick: () => {
            let text = this.cheatsheet.content
            navigator.clipboard.writeText(text)
          },
        })
      }

      if (this.cheatsheet.tags.length > 0) {
        items.push({
          label: 'Copy json',
          onClick: () => {
            let text = JSON.stringify(
              unwrapCheatSheet(this.cheatsheet, this.cheatsheet.tags),
            )
            navigator.clipboard.writeText(text)
          },
        })
      }

      if (this.isNotRead) {
        items.push({
          label: 'Paste',
          onClick: () => {
            navigator.clipboard.readText().then((text) => {
              try {
                let cheatSheet = JSON.parse(text)

                this.cheatsheet.tags = cheatSheet.tags
                this.cheatsheet.link = cheatSheet.link
                this.cheatsheet.content = cheatSheet.content
              } catch (exception) {
                console.error(exception)

                this.cheatsheet.content = text
              }
            })
          },
        })
      }

      this.$contextmenu({
        x: e.pageX,
        y: e.pageY,
        items: items,
      })

      e.handle = true
      // e.stopPropagation()
      return false
    },
    allAnchorOpenInNewTag(event) {
      this.$nextTick(() => {
        event.viewer.querySelector('a')?.setAttribute('target', '_blank')
      })
    },
  },
}
</script>

<style lang="scss" scoped>
@import "../../styles/variables";

$sky: #e6f6fe;

.selectElementInLine {
  display: flex;
  flex-direction: row;
  column-gap: 10px;

  div {
    line-height: 2em;
    padding: 5px 5px;
  }
  div.selected {
    border: 1px solid #bbfdc6;
    border-radius: 5px;
    color: green;
  }
}

.info.selected {
  border-color: #6dfc85;
}

.link.selected {
  border-color: #9adafa;
}

// .selected {
//   border-width: 2px !important;
// }

.hide {
  display: none !important;
}

.copy {
  position: absolute;
  top: -20px;
  right: -20px;
}

.cheatsheet {
  border-width: 2px !important;
  border-style: solid;
  border-color: $background;
  position: relative;
  display: block;
  font-size: 1rem;
  transition: all 0.2s;
  border-radius: 5px;
  margin: 8px 8px;
  margin-top: 16px;
  text-align: left;
  color: $black;
  font-family: $roboto;
  overflow: visible;

  .header {
    font-size: 1.125rem;
    padding: 0 1rem;
    line-height: 1.125rem;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      line-height: 1.5rem;
      vertical-align: middle;
      font-weight: 500;
      color: #194c66;
    }

    .reference {
      font-size: 1rem;
      margin-top: auto;
      font-style: italic;
      font-weight: lighter;
      align-items: baseline;
      padding-bottom: 0.125rem;
    }
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    font-size: 14px;
    color: #727680;
    margin-right: 20px;
    span {
      cursor: pointer;
    }
  }

  .edit-buttons {
    display: flex;

    .label {
      margin: 5px 5px;
      vertical-align: middle;
      line-height: 30px;
    }
    .close {
      margin: 5px 5px;
      cursor: pointer;
    }

    .save {
      cursor: pointer;
      margin: 5px 5px;
    }
  }

  code {
    font-family: $firacode;

    span {
      font-family: consolas, cursive;
      font-style: italic;
      font-size: 1rem;
      color: hsl(210deg, 10%, 70%);
    }
  }
}
</style>
