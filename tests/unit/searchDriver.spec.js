import { expect } from 'chai'
import SearchDriver from '../../src/src_jq/common/searchDriver'

describe('full-text search test', () => {
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
        ],
        'n': 1,
        'd': 2,
        'link': 'https://medium.com/seminal/auto-complete-feature-for-all-e4b272f5cd54',
      },
      {
        'id': 1632743375178,
        'type': 'cheatsheet',
        'date': 1632743375178,
        'content': '`let tab = await chorme.tabs.get(<tabId>);`',
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

  it('search by frequent word "get"', () => {
    let cheatsheets = samples.getAndLink

    let searchDriver = new SearchDriver()
    searchDriver.init(cheatsheets)

    let searchResult = searchDriver.search('get')

    expect(searchResult.length).to.gt(1)
    expect(searchResult[0].content).to.contains('get')
    expect(searchResult[0].id).to.eq(1632743375178)
  })

  it('search by link', () => {
    let cheatsheets = samples.getAndLink

    let searchDriver = new SearchDriver()
    searchDriver.init(cheatsheets)

    let link = 'https://medium.com/seminal/auto-complete-feature-for-all-e4b272f5cd54'
    let searchResult = searchDriver.search(link)

    expect(searchResult.length).to.gte(1)
    expect(searchResult[0].link).to.eq(link)
    expect(searchResult[0].id).to.eq(1646053123831)
  })

  it('search by link text', () => {
    let cheatsheets = samples.getAndLink

    let searchDriver = new SearchDriver()
    searchDriver.init(cheatsheets)

    let searchResult = searchDriver.search('feature')

    expect(searchResult.length).to.gte(1)
    expect(searchResult[0].content).to.contains('feature')
    expect(searchResult[0].link).to.eq('https://medium.com/seminal/auto-complete-feature-for-all-e4b272f5cd54')
    expect(searchResult[0].id).to.eq(1646053123831)
  })
})
