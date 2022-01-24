<template>
  <div
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
            moveToTags(tags.length > 0 ? tags[tags.length - 1].text : '')
          "
      /></span>
      <span v-for="tag in tags" :key="tag.id" @click="moveToTags(tag.text)"
        >{{ tag.text }}&nbsp;&nbsp;</span
      >
    </p>
    <p v-if="isNotRead">
      <select2
        v-on:tags-input="tagsLoad"
        :options="options"
        v-model="editTags"
        :placeholder="'Enumerate the tags to search for this element'"
      >
      </select2>
    </p>
    <Editor ref="editor" v-if="isNotRead" :initialValue="cheatsheet.content" />
    <Viewer
      v-if="!isNotRead"
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
    <Menu :elements="menuElements" :textElements="textMenuElements"> </Menu>
  </div>
</template>

<script>
import '@toast-ui/editor/dist/toastui-editor.css' // Editor's Style

import $ from 'jquery'
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

window.$ = $

export default {
  name: 'CheatSheet',
  emits: [
    'move-to-tags',
    'cancel-edit',
    'remove-cheatsheets',
    'selected-few-elements',
    'selected',
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
      this.updateEditTags()

      return this.cheatsheet.tags.filter(
        (t) => !(
          this.commonTags
            && this.commonTags.length > 0
            && this.commonTags.findIndex((ct) => t.id === ct.id) >= 0
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
        this.updateEditTags()
      }
    },
    type(value) {
      this.editType = value
    },
  },
  methods: {
    tagsLoad() {
      this.smartotekaFabric
        .queriesProvider()
        .getTags()
        .then((tags, changed) => {
          if (this.options.length === 0 || changed) {
            this.options = unique(
              tags.filter((el) => el),
              (el) => el.id,
            )
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
          !(
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
    moveToTags(tagId) {
      let flag = true
      let tags = takeWhile(this.cheatsheet.tags, (el) => {
        let prevValue = flag
        flag = el.id !== tagId

        return prevValue
      })

      this.$emit('move-to-tags', tags)
    },
    addButtonsToCodeBlocks() {
      let vm = this

      $('code .copy', this.$el).remove()
      let codeEls = $('code', this.$el)

      codeEls.append(
        '<img class="copy" style="display:none" src="/images/copy.svg" data-v-2d0b1742="">',
      )
      codeEls.css('position', 'relative')

      codeEls.on('mouseleave', function () {
        let that = this

        let hideWithTimeout = () => {
          if ($('img', that).hasClass('focus')) {
            setTimeout(hideWithTimeout, 200)
          } else {
            $('img', that).hide()
          }
        }

        setTimeout(hideWithTimeout, 200)
      })

      codeEls.on('contextmenu', function (e) {
        if (e.originalEvent.handle) {
          return
        }
        e.preventDefault()

        let items = []
        items.push({
          label: 'Copy',
          onClick: () => {
            let text = $(e.target).closest('.toastui-editor-contents').text()
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

      codeEls.on('mouseenter', function () {
        $('img', this).show()
      })

      $('img.copy', codeEls).on('mouseleave', function (e) {
        $(this).removeClass('focus')
      })
      $('img.copy', codeEls).on('mouseenter', function (e) {
        $(this).addClass('focus')
      })
      $('img.copy', codeEls).on('click', function (e) {
        e.stopPropagation()

        $(this).css({ 'background-color': '#bbfdc6' })
        let text = $(this).parent().text()

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
    },
    updateEditTags() {
      this.editTags = this.cheatsheet.tags.slice(0)
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
        this.cheatsheet.tags = unique(this.editTags.slice(0), (el) => el.id)
      }

      if (this.$refs.editor) {
        this.cheatsheet.content = this.$refs.editor.editor.getMarkdown()
      }

      this.cheatsheet.type = this.editType
      let saveCheatSheet = unwrapCheatSheet(this.cheatsheet, this.editTags)

      let newTags = this.editTags.filter(el => el.newTag)

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
      if ($(e.target).closest('.toastui-editor').length > 0) {
        return
      }
      // prevent the browser's default menu
      e.preventDefault()

      let items = []

      if (this.cheatsheet.content) {
        items.push({
          label: 'Copy text',
          onClick: () => {
            let text = $(e.target).closest('.toastui-editor-contents').text()
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
        $('a', event.viewer).attr('target', '_blank')
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
  border-color: #f8fafc;
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
    font-size: 0.875rem;
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
