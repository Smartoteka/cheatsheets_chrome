<template>
  <div    :class="
      'cheatsheet ' +
      (cheatsheet.link ? 'link' : 'info') +
      (selected ? ' selected' : '')
    "
    @click="selected = !selected"
    v-click-outside="clickOutside"
     @contextmenu="onContextMenu($event)"
  >
    <div
      class="content"
      @mouseenter="mouseFocus = true"
      @mouseleave="mouseFocus = false"
    >
      <div :class="'tags ' + (editMode ? 'hide' : '')">
        <span v-for="tag in tags" :key="tag.id" @click="moveToTags(tag.id)"
          >{{ tag.text }}&nbsp;</span
        >
      </div>
      <div class="tags" v-if="editMode">
        <select2 :options="allTags" v-model="editTags"> </select2>
      </div>
      <div class="code" v-if="!hideContent">
        <Editor
          ref="editor"
          v-if="editMode"
          :initialValue="cheatsheet.content"
        />
        <Viewer v-if="!editMode" :initialValue="content" :content="content" />
      </div>

      <div class="edit-buttons" v-if="editMode">
        <img src="/images/save.svg" class="save" @click="save" />
        <img src="/images/x.svg" class="close" @click="cancel" />
      </div>
      <Menu
        v-if="mouseFocus && !editMode && !readOnly"
        :elements="menuElements" :textElements="textMenuElements"
      >
      </Menu>
    </div>
  </div>
</template>

<script>
import '@toast-ui/editor/dist/toastui-editor.css' // Editor's Style

import $ from 'jquery'
import { takeWhile } from 'lodash'
import Viewer from './Viewer'
import Editor from './Editor'
import Select2 from '@/common/Select2'
import ClickOutsideEvent from '@/common/directives/ClickOutside'
import {
  unwrapCheatSheet, closeTabsByUrlIfOpen, openTabsInNewWindow, openTabs,
  unique,
} from '@/src_jq/common/commonFunctions'
import Menu from './menu'

window.$ = $

export default {
  name: 'CheatSheet',
  emits: ['move-to-tags', 'cancel-edit'],
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
    commonTagsCount: {
      type: Number,
      default: () => 0,
    },
    allTags: {
      type: Array,
      default: () => [],
    },
    edit: {
      type: Boolean,
      defautl: () => false,
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
  },
  data() {
    return {
      selected: false,
      editTags: [],
      editorOptions: {
        usageStatistics: false,
      },
      mouseFocus: false,
      editMode: false,
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
    }
  },
  beforeMount: function () {
    this.editMode = this.edit
  },
  mounted: function () {
    this.addButtonsToCodeBlocks()
  },
  updated: function () {
    if (!this.editMode) {
      this.addButtonsToCodeBlocks()
    }
  },
  computed: {
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

      return this.cheatsheet.tags.slice(this.commonTagsCount)
    },
    content() {
      return this.cheatsheet.content
    },
  },
  watch: {
    editMode(value) {
      if (value) {
        this.updateEditTags()
      }
    },
    selected(value) {
      this.cheatsheet.selected = value
      return true
    },
  },
  methods: {
    getTabs() {
      return [{ url: this.cheatsheet.link }]
    },
    clickOutside(event) {
      if (this.selected) {
        console.log('outside!')
        if (!(event.ctrlKey || event.shiftKey
        || (
          event.target.parentElement
          && (
            event.target.parentElement.classList.contains('dropdown')
            || event.target.parentElement.classList.contains('menu')
          )))) {
          this.selected = false
        }
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
      $('.code .copy', this.$el).remove()
      let codeEls = $('.code code', this.$el).parent()

      codeEls.append(
        '<img class="copy" style="display:none" src="/images/copy.svg" data-v-2d0b1742="">',
      )
      codeEls.css('position', 'relative')

      codeEls.on('mouseleave', function () {
        $('img', this).hide()
      })
      codeEls.on('mouseenter', function () {
        $('img', this).show()
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
      this.editMode = true
    },
    removeCheatSheet() {
      this.$emit('remove-cheatsheets', [this.cheatsheet])
    },
    save() {
      this.editMode = false
      this.mouseFocus = false

      this.cheatsheet.tags = unique(this.editTags.slice(0), el => el.id)
      if (this.$refs.editor) {
        this.cheatsheet.content = this.$refs.editor.editor.getMarkdown()
      }

      let saveCheatSheet = unwrapCheatSheet(this.cheatsheet, this.editTags)

      this.$emit('update-cheatsheet', saveCheatSheet)
    },
    cancel() {
      this.editMode = false
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
      let items = [
        {
          label: 'Copy',
          onClick: () => {
            let text = JSON.stringify(unwrapCheatSheet(this.cheatsheet, this.cheatsheet.tags))
            navigator.clipboard.writeText(text)
          },
        },
      ]

      if (this.edit) {
        items.push({
          label: 'Paste',
          onClick: () => {
            navigator.clipboard.readText()
              .then(text => {
                let cheatSheet = JSON.parse(text)

                this.cheatsheet.tags = cheatSheet.tags
                this.cheatsheet.link = cheatSheet.link
                this.cheatsheet.content = cheatSheet.content
              })
          },
        })
      }
      // prevent the browser's default menu
      e.preventDefault()
      // shou our menu
      this.$contextmenu({
        x: e.x,
        y: e.y,
        items: items,
      })
    },
  },
}
</script>

<style lang="scss" scoped>
@import "../../styles/variables";

$sky: #e6f6fe;

.info {
  border: 2px solid #bbfdc6;
}

.link {
  border: 2px solid #e6f6fe;
}

.selected {
  border-width: 4px !important;
  margin: 6px 6px !important;
}

.hide {
  display: none !important;
}

.copy {
  position: absolute;
  top: 2px;
  right: 2px;
}

.cheatsheet {
  float: left;
  display: inline;
  z-index: 10;
  background: white;
  font-size: 1rem;
  transition: all 0.2s;
  border-radius: 5px;
  margin: 8px 8px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.1);
  text-align: left;
  color: $black;
  font-family: $roboto;
  overflow: visible;

  .header {
    background: #e6f6fe;
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
    font-size: 0.875rem;
    color: #6d88df;
    margin-right: 20px;
    span {
      cursor: pointer;
    }
  }
  .content {
    position: relative;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    display: grid;
    row-gap: 4px;

    .code {
      position: relative;
      margin-right: 20px;
    }

    .edit-buttons {
      height: 30px;
      position: relative;
      margin-right: 20px;

      .close {
        position: absolute;
        right: 5px;
        cursor: pointer;
      }

      .save {
        position: absolute;
        right: 40px;
        cursor: pointer;
      }
    }
    hr {
      height: 1px;
      border: none;
      /* Set the hr color */
      color: #e6f6fe; /* old IE */
      background-color: #e6f6fe; /* Modern Browsers */
    }

    .tags {
      display: flex;
      font-size: 0.75rem;
      flex-wrap: wrap;
      .tag {
        text-transform: lowercase;
        font-weight: 500;
        padding: 0 8px;
        background: #9dd5f1;
        color: white;
        border-radius: 50vmin;
        margin-right: 3px;
        margin-bottom: 3px;
      }
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
