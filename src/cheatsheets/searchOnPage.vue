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

      <search v-if="!newCheatSheet || distributeTabToGroups">
        <!-- <p>Selected: {{ selected }}</p> -->

        <div style="display: flex">
          <Multiselect
          ref="multiselect"
          label="text"
          valueProp="id"
          v-model="selected"
          mode="tags"
          placeholder="Click here and start typing to search"
          :options="async (query) => await queryOptions(query)"
          :addOptionOn="['tab','enter','space']"
          :min-chars="0"
          :limit="20"
          :resolve-on-load="false"
          :close-on-select="true"
          :create-option="true"
          :delay="0"
          :searchable="true"
          @change="searchTagsChange"
        />
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
      </search>
    </main>
  </div>
</template>

<script>

import '@vueform/multiselect/themes/default.css'

import Multiselect from '@vueform/multiselect'
import Navbar from '../common/Navbar'

import StatusBar from './components/StatusBar'
import SearchDriver from '@/src_jq/common/searchDriver'
import {
  unique,
  getSmartotekaFabric,
  getActiveTab,
  openTabs,
} from '../src_jq/common/commonFunctions'
import storage from '../utils/storage'

export default {
  name: 'App',
  components: {
    Navbar,
    StatusBar,
    Multiselect,
  },
  props: {
    popup: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      options: [],
      selected: [],
    }
  },
  beforeMount() {
    this.searchDriver = new SearchDriver()

    // chrome.scripting.registerContentScript({
    //   matches: ['https://*/*'],
    //   all_frames: true,
    //   js: ['search/searchPageEngine.js'],
    // })

    // [].forEach.call(
    //     document.querySelectorAll('.type.stack[data-ch-id]'),
    //     el => {
    //       const titleElement = el.querySelector('h3');
    //       const memberName = titleElement.textContent;
    //       const camelCaseSplit = memberName.replace(
    //         /([a-z0-9])([A-Z])/g,
    //         '$1 $2'
    //       );
    //       const type = titleElement.attributes['id'].value.split('-')[0];
    //       const doc = {
    //         id: el.attributes['data-ch-id'].value,
    //         content: el.textContent,
    //         memberName:
    //           camelCaseSplit === memberName ? memberName : camelCaseSplit,
    //         shortDescription: el.querySelector('p')?.textContent,
    //         tag: '',
    //         //TODO: добавить группу event, type, method
    //       };

    //       doc.tags =
    //         type + ',' + doc.memberName + ', ' + (doc.shortDescription || '');
    //       doc.tags = doc.tags.toLowerCase();

    //       elasticlunr.tokenizer.seperator = /[\s\-(),.]+/g;
    //       const tags = elasticlunr.tokenizer(doc.tags);

    //       tags.forEach(tag => {
    //         tag = elasticlunr.trimmer(tag);
    //         const token = elasticlunr.stemmer(tag);
    //         if (!(token in stopWords)) {
    //           this.tags.add(tag);
    //         }
    //       });

    //       this.index.addDoc(doc);
    //       // console.log(doc.tags);
    //     }
    //   );
    let vm = this

    window.addEventListener(
      'keypress',
      (e) => {
        const activeElement = document.activeElement

        if (e.code === 'Escape') {
          setTimeout(() => activeElement.blur())
          return
        }

        if (
          activeElement.type === 'textarea'
          || activeElement.type === 'text'
          || activeElement.closest('.toastui-editor') !== null
        ) {
          return
        }

        switch (e.key) {
          case 'f':
            setTimeout(
              () => document.querySelector('search .multiselect-tags-search').focus(),
              0,
            )
            break
          default:
            break
        }
      },
      false,
    )
  },
  mounted() {
    let vm = this
    console.log('mounted ' + new Date().getTime())

    setTimeout(
      () => document.querySelector('search .multiselect-tags-search').focus(),
      5,
    )
  },
  computed: {
    smartotekaFabric() {
      return getSmartotekaFabric()
    },
  },
  watch: {
  },
  methods: {
    searchTagsChange() {
      // if (this.cheatsheets.length === 0) {
      this.refresh()
      //   }

      storage.get('acitveTabWindowId').then(windowId => {
        getActiveTab(windowId).then((tab) => {
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id },
              files: ['search/searchPageEngine.js'],
              // func: () => {
              //   document.body.style.backgroundColor = 'red'
              //   return document.body
              // },
            },
            () => {
              chrome.tabs.sendMessage(tab.id, this.selected, (result) => {
                console.log(result)
              })
            },
          )
        })
      })
    },
    refresh() {
      console.log('cheatsheets refresh')
      return this.smartotekaFabric
        .queriesProvider()
        .getCheatSheets()
        .then((cheatsheets) => {
          this.cheatsheets = reactive(cheatsheets)

          this.searchDriver.init(this.cheatsheets)
        })
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
