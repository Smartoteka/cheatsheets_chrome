import { expect } from 'chai'
import { cheatsheetsGroupByPreparedGroups } from '../../src/src_jq/common/cheatSheetsManage'

describe('Cheatsheets prepare group', () => {
  it('join two in one group', () => {
    let cheatsheets = [{
      'content': 'Format document Alt + Shift + F',
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
      'content': 'Go back - Alt + Left',
      'date': 1633338304074,
      'id': 1633338304074,
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
      'content': 'Go back - Alt + Left',
      'date': 16333383040741,
      'id': 16333383040741,
      'type': 'group',
      'tags': [{
        'id': 'vs code',
        'text': 'vs code',
      }],
    }]

    let groups = cheatsheetsGroupByPreparedGroups(cheatsheets)

    expect(groups.length).to.eq(1)
    expect(groups[0].commonTagsCount).to.eq(1)
    expect(groups[0].items.length).to.eq(3)
  })

  it('join two in two groups', () => {
    let cheatsheets = [{
      'content': 'Format document Alt + Shift + F',
      'date': 1633335302157,
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
      'content': 'Go back - Alt + Left',
      'date': 1633338304074,
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
      'content': '',
      'date': 16333383040741,
      'type': 'group',
      'tags': [{
        'id': 'vs code',
        'text': 'vs code',
      }],
    },
    {
      'content': '',
      'date': 16333383040742,
      'type': 'group',
      'tags': [{
        'id': 'shortcut',
        'text': 'shortcut',
      }],
    }]

    let groups = cheatsheetsGroupByPreparedGroups(cheatsheets)

    expect(groups.length).to.eq(2)
    expect(groups[0].commonTagsCount).to.eq(1)
    expect(groups[0].items.length).to.eq(3)

    expect(groups[1].commonTagsCount).to.eq(1)
    expect(groups[1].items.length).to.eq(3)
  })
})
