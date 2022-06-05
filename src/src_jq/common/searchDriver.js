import { comparerFunc, comparerFuncDesc } from './rateTags'
import {
  getMatches,
} from './commonFunctions'

const elasticlunr = require('elasticlunr')

require('../../lib/lunr.stemmer.support.js')(elasticlunr)
require('../../lib/lunr.ru.js')(elasticlunr)
require('../../lib/lunr.multi.js')(elasticlunr)

export default class SearchDriver {
  constructor() {
    elasticlunr.tokenizer.setSeperator(/[@"-\/:\s(),.\]\[]+/)
    elasticlunr.clearStopWords()
    elasticlunr.addStopWords(['https', 'http', 'www', 'com', 'ru', 'nbsp'])
  }

  init(cheatsheets) {
    this.searchIndex = elasticlunr(function () {
      // this.DocumentStore(false)

      this.use(elasticlunr.multiLanguage('en', 'ru'))

      this.addField('content')
      this.addField('joinedTags')

      this.setRef('id')
    })
    cheatsheets.forEach((cheatsheet) => {
      if (cheatsheet.tags.findIndex(tag => tag.text === 'hideForMe') !== -1) { return }
      const links = getMatches(cheatsheet.content, /[^\]]+\]\((?<l>[^\)]+)\)/g, 1)
      let tagsText = cheatsheet.tags
        .map((el) => el.text || el)
      let joinedTags = tagsText
        .concat(links)
        .join(' ')

      this.searchIndex.addDoc({
        id: cheatsheet.id,
        joinedTags: joinedTags,
        tagsText: tagsText,
        content: cheatsheet.content.replace(/<[^>]+>/g, ''),
      })
    })

    this.cheatsheets = cheatsheets
  }

  #search(searchValue) {
    return this.searchIndex
      .search(searchValue, {
        fields: {
          joinedTags: { boost: 1 },
          content: { boost: 2 },
        },
      })
  }

  search(searchValue) {
    let cheatsheetIdToScoreMap = {}
    this.#search(searchValue)
      .forEach((el) => {
        cheatsheetIdToScoreMap[parseInt(el.ref, 10)] = el.score
      })

    let cheatsheets = this.cheatsheets

    if (searchValue.indexOf('hideForMe') < 0) {
      cheatsheets = cheatsheets.filter(
        (el) => el.tags.findIndex((tag) => tag.text === 'hideForMe') < 0,
      )
    }

    let searchResult = cheatsheets
      .filter((el) => {
        let score = cheatsheetIdToScoreMap[el.id]

        if (!score) {
          return false
        }

        el.score = score
        return true
      })
      .sort(comparerFuncDesc((el) => el.score))

    return searchResult
  }

  getMostPopularWords() {
    let root = this.searchIndex.index.joinedTags.root

    let tagsPopular = []
    getMostPopularWords(root, tagsPopular, '')

    let contentPopular = []
    getMostPopularWords(this.searchIndex.index.content.root, contentPopular, '')

    // tagsPopular = _.take(tagsPopular.sort(comparerFuncDesc(el => el.df)), 200)
    // contentPopular = _.take(contentPopular.sort(comparerFuncDesc(el => el.df)), 200)

    contentPopular.forEach(word => {
      const index = tagsPopular.findIndex(el => el.w === word.w)
      if (index < 0) {
        tagsPopular.push(word)
      } else {
        tagsPopular[index].df += word.df / 2
      }
    })

    tagsPopular = tagsPopular.sort(comparerFuncDesc(el => el.df))
    return tagsPopular
  }

  getAutocomplete(tags) {
    if (!tags.length) {
      return this.getMostPopularWords().map((el) => el.w)
    }
    const searchedRefs = this.#search(tags.join(' '))
    const searchedCheatSheets = searchedRefs.map(el => this.searchIndex.documentStore.getDoc(el.ref))
    const arrayOfTagsArray = searchedCheatSheets.map(el => el.tagsText.filter(tag => tags.findIndex(ft => ft.toLowerCase() === tag.toLowerCase()) === -1))

    let tagsSet = new Set([].concat(...arrayOfTagsArray))
    // tags.forEach(tag => tagsSet.delete(tag))

    const resultTags = [...tagsSet]

    return resultTags
  }
}

function getMostPopularWords(root, ar, path) {
  if (path.length > 30) { return }
  for (let key in root) {
    switch (key) {
      case 'df':
      {
        if (root.df > 1 && path.length > 2) {
          ar.push({ w: path, df: root.df })
        }
        break
      }
      case 'docs':
        break
      default:
        if (key.length === 1) {
          getMostPopularWords(root[key], ar, path + key)
        }
        break
    }
  }

  return ar
}
