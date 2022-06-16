<template>
  <div ref="toastuiEditor"></div>
</template>
<script>
import Editor from '@toast-ui/editor'
import { optionsMixin } from './mixin/option'
import {
  getActiveTab,
} from '@/src_jq/common/commonFunctions'
import storage from '@/utils/storage'

let editor = null
export default {
  name: 'ToastuiEditor',
  mixins: [optionsMixin],
  props: {
    previewStyle: {
      type: String,
    },
    height: {
      type: String,
    },
    initialEditType: {
      type: String,
    },
    initialValue: {
      type: String,
    },
    options: {
      type: Object,
    },
  },
  watch: {
    previewStyle(newValue) {
      editor.changePreviewStyle(newValue)
    },
    height(newValue) {
      editor.height(newValue)
    },
  },
  mounted() {
    // chrome.scripting.registerContentScripts([{
    //   id: 'youtube-contentScript',
    //   matches: ['https://youtube.com/watch*'],
    //   js: ['cheatsheets/contentScript.js'],
    // }])

    // const reWidgetRule = /\[(@\S+)\]\((\S+)\)/

    let vm = this
    const options = {
      ...this.computedOptions,
      el: this.$refs.toastuiEditor,
      // widgetRules: [
      //   {
      //     rule: reWidgetRule,
      //     toDOM(text) {
      //       const rule = reWidgetRule
      //       const matched = text.match(rule)
      //       const span = document.createElement('span')

      //       span.innerHTML = `<a class="widget-anchor" href="${matched[2]}">${matched[1]}</a>`
      //       return span
      //     },
      //   },
      // ],
      // customHTMLRenderer: {
      //   yt(node) {
      //     // const video = document.querySelector('#ytd-player video')
      //     const body = document.createElement('div')

      //     if (!node.literal) {
      //       const dt = new Date().toString()

      //       body.innerHTML = '' + dt
      //       let markdown = editor.getMarkdown()

      //       markdown = markdown.replace('$$yt', dt)

      //       setTimeout(() => editor.setMarkdown(markdown), 0)
      //     } else {
      //       body.innerHTML = node.literal
      //     }

      //     return [
      //       { type: 'openTag', tagName: 'div', outerNewLine: true },
      //       { type: 'html', content: body.innerHTML },
      //       { type: 'closeTag', tagName: 'div', outerNewLine: true },
      //     ]
      //   },
      // },
    }

    let rememberPos = null
    function formatTime(seconds) {
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      const s = Math.round(seconds % 60)
      return [
        h,
        m > 9 ? m : ('0' + m),
        s > 9 ? s : '0' + s,
      ].filter(Boolean).join(':')
    }

    let selectAutocomplete = (text, replaceLength) => {
      text = text
        .replace(/\s/g, '')
        .replace(/😎/g, '')

      if (text === 'time') {
        const [_, end] = editor.getSelection()

        storage.get('acitveTabWindowId').then(windowId => {
          getActiveTab(windowId).then((tab) => {
            chrome.tabs.sendMessage(
              tab.id,
              {
                cmd: 'getYoutubeCurrentTime',

              },
              (result) => {
                if (result.success) {
                  editor.replaceSelection(
                    formatTime(result.currentTime),
                    rememberPos,
                    end,
                  )
                } else {
                  console.log(result.message)
                }
              },
            )
          })
        })
      }
    }
    editor = new Editor(options)
    // editor.on('change', (args) => { console.log(args) })

    let ul = null
    editor.on('keyup', (editorType, ev) => {
      if (ev.key === '$' || ev.key === ';') {
        [rememberPos, _] = editor.getSelection()
        rememberPos[1] -= 1
        ul = document.createElement('ul')

        ul.classList.add('vs__list')
        ul.innerHTML = `
      <li class='active'>time</li>
    `

        editor.addWidget(ul, 'bottom')

        ul.addEventListener('mousedown', (ev) => {
          selectAutocomplete(ev.target.textContent, 1)
          ul = null
        })
      } else if (ev.key === 'Enter') {
        if (ul != null) {
          selectAutocomplete(ul.querySelector('.active').textContent, 2)
          ul = null
        }
      }
    })
  },
  updated() {
    let options = {
      ...this.computedOptions,
      el: this.$refs.toastuiEditor,
    }

    options.initialValue = this.initialValue
    editor = new Editor(options)
  },
  methods: {
    getRootElement() {
      return this.$refs.toastuiEditor
    },
    getEditor() {
      return editor
    },
  },
}
</script>

<style>
  .vs__list {
    width: 100%;
    text-align: left;
    border: none;
    border-top: none;
    max-height: 400px;
    overflow-y: auto;
    border-bottom: 1px solid #023d7b;
    position: relative;
  }
  .vs__list li {
    background-color: #fff;
    padding: 10px;
    border-left: 1px solid #023d7b;
    border-right: 1px solid #023d7b;
  }
  .vs__list li:last-child {
    border-bottom: none;
  }
  .vs__list li:hover {
    background-color: #eee !important;
  }
  .vs__list,
  .vs__loading {
    position: absolute;
  }
  .vs__list li {
    cursor: pointer;
  }
  .vs__list li.active {
    background-color: #f3f6fa;
  }
</style>
