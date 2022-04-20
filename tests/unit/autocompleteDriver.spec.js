import { expect } from 'chai'
import SearchDriver from '../../src/src_jq/common/searchDriver'

describe('autocomplete test', () => {
  let samples = {
    getAndLink: [
      {
        'id': 1646053123831,
        'type': 'cheatsheet',
        'date': 1646053123831,
        'content': '<img align="left" width="16 px" src="https://medium.com/favicon.ico" />&nbsp;[Auto-complete feature for all. Open-source Recommendations | by Hemprasad Badgujar | McKinley & Rice | Medium](https://medium.com/seminal/auto-complete-feature-for-all-e4b272f5cd54)',
        'tags': [
          { 'id': '225490031', 'text': 'algorithm' },
          { 'id': '-837947416', 'text': 'autocomplete' },
          { 'id': '-1791093683', 'text': 'smartoteka' },
          { 'id': 'tab', 'text': 'tab' },
        ],
        'n': 1,
        'd': 2,
        'link': 'https://medium.com/seminal/auto-complete-feature-for-all-e4b272f5cd54',
      },
      {
        'id': 1632743375178,
        'type': 'cheatsheet',
        'date': 1632743375178,
        'content': '`let tab = await chrome.tabs.get(<tabId>);`',
        'tags': [
          { 'id': 'Chrome', 'text': 'Chrome' },
          { 'id': 'Api', 'text': 'Api' },
          { 'id': 'tab', 'text': 'tab' },
          { 'id': 'active', 'text': 'active' },
          { 'id': 'get', 'text': 'get' },
          { 'id': 'Id', 'text': 'Id' }],
        'n': 2,
        'd': 15,
      },
      {
        'id': 1632744991925,
        'type': 'cheatsheet',
        'date': 1632744991925,
        'content': '`let tabs = chrome.tabs.getAllInWindow(<windowIdOrNullForCurrent>)`',
        'tags': [
          { 'id': 'Chrome', 'text': 'Chrome' },
          { 'id': 'Api', 'text': 'Api' },
          { 'id': 'tab', 'text': 'tab' },
          { 'id': 'all', 'text': 'all' },
          { 'id': 'get', 'text': 'get' },
          { 'id': 'in', 'text': 'in' },
          { 'id': 'window', 'text': 'window' }],
        'n': 1,
        'd': 7,
      }],
  }

  it('empty search give most tfidf words', () => {
    let cheatsheets = samples.getAndLink

    let searchDriver = new SearchDriver()
    searchDriver.init(cheatsheets)

    let searchResult = searchDriver.getMostPopularWords()

    expect(searchResult.length).to.gt(1)
    expect(searchResult[0].w).to.contains('tab')
  })

  it('two key words give key word use in cheatsheets (Chrome api => tab)', () => {
    let cheatsheets = samples.getAndLink

    let searchDriver = new SearchDriver()
    searchDriver.init(cheatsheets)

    let searchResult = searchDriver.getAutocomplete(['chrome', 'api'])

    expect(searchResult.length).to.gt(1)
    expect(searchResult[0]).to.contains('Chrome')
  })
})
