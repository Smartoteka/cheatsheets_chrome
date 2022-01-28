import { expect } from 'chai'
import { buildSternBrokkoTree, moveCheatSheets, sortSternBroko } from '../../src/src_jq/common/cheatSheetsManage'

describe('move cheatsheets', () => {
  let getCheatsheets = () => ([{
    'content': 'c1',
    'date': 1633335302157,
    'id': 1633335302157,
    'tags': [{
      'id': 'vs code',
      'text': 'vs code',
    }, {
      'id': 'vs',
      'text': 'vs',
    }, {
      'id': 'shortcut',
      'text': 'shortcut',
    }, {
      'id': 'format',
      'text': 'format',
    }],
  }, {
    'content': 'c2',
    'date': 1633338304074,
    'id': 1633338304074,
    'type': 'group',
    'tags': [{
      'id': 'vs code',
      'text': 'vs code',
    }, {
      'id': 'vs',
      'text': 'vs',
    }, {
      'id': 'shortcut',
      'text': 'shortcut',
    }, {
      'id': 'go',
      'text': 'go',
    }],
  },
  {
    'content': 'c3',
    'date': 16333383040741,
    'id': 16333383040741,
    'type': 'group',
    'tags': [{
      'id': 'vs code',
      'text': 'vs code',
    }],
  }])

  it('give c1,c2,c3. move c2 to c3 pos. should c1,c3, c2', () => {
    let cheatsheets = getCheatsheets()
    buildSternBrokkoTree(cheatsheets, -1, cheatsheets.length)

    moveCheatSheets(cheatsheets, cheatsheets[cheatsheets.length - 1], [cheatsheets[1]])

    cheatsheets = sortSternBroko(cheatsheets)

    expect('c3').to.eq(cheatsheets[cheatsheets.length - 2].content)
    expect('c2').to.eq(cheatsheets[cheatsheets.length - 1].content)
  })

  it('give c1,c2,c3. init sternBroko. Sort sternBroko. should c1,c2, c3', () => {
    let cheatsheets = getCheatsheets()
    buildSternBrokkoTree(cheatsheets, -1, cheatsheets.length)
    cheatsheets = sortSternBroko(cheatsheets)

    expect('c1').to.eq(cheatsheets[0].content)
    expect('c2').to.eq(cheatsheets[1].content)
    expect('c3').to.eq(cheatsheets[2].content)
  })
})
