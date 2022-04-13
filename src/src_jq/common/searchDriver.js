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
    elasticlunr.tokenizer.setSeperator(/[\s(),.\]\[]+/)
    elasticlunr.clearStopWords()
  }

  init(cheatsheets) {
    this.index = elasticlunr(function () {
      // this.DocumentStore(false)

      this.use(elasticlunr.multiLanguage('en', 'ru'))

      this.addField('content')
      this.addField('joinedTags')

      this.setRef('id')
    })
    cheatsheets.forEach((cheatsheet) => {
      const links = getMatches(cheatsheet.content, /[^\]]+\]\((?<l>[^\)]+)\)/g, 1)
      cheatsheet.joinedTags = cheatsheet.tags
        .map((el) => el.text)
        .concat(links)
        .join(', ')

      this.index.addDoc(cheatsheet)
    })

    this.cheatsheets = cheatsheets
  }

  search(searchValue) {
    let cheatsheetIdToScoreMap = {}
    this.index
      .search(searchValue, {
        fields: {
          joinedTags: { boost: 1 },
          content: { boost: 2 },
        },
      })
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
}
