import { expect } from 'chai'
import { setSearchHashs, findTagsInOrderedTags, tagsToOrderedHashs } from '../../src/src_jq/common/cheatSheetsManage'
import { grapTags } from '../../src/src_jq/common/commonFunctions'

describe('search cheatsheets', () => {
  it('search one by two tags', () => {
    let cheatsheets = [{
      'content': 'item vs code, vs, shortcut, format',
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
      'content': 'group vs code, vs, shortcut, go',
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
      'content': 'group vs code',
      'date': 16333383040741,
      'id': 16333383040741,
      'type': 'group',
      'tags': [{
        'id': 'vs code',
        'text': 'vs code',
      }],
    }]

    let allTags = grapTags(cheatsheets)

    let tagsMap = setSearchHashs(cheatsheets, allTags)

    let searchTags = tagsToOrderedHashs(['vs code', 'go'].map(tag => tagsMap[tag]))
    let foundCheatsheets = cheatsheets.filter(cheatsheet => findTagsInOrderedTags(searchTags, cheatsheet.orderedTags))

    expect(foundCheatsheets.length).to.eq(1)
  })

  it('search one from one-element colection', () => {
    let cheatsheet = {
      'content': 'group vs code, vs, shortcut, go',
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
    }

    let allTags = grapTags([cheatsheet])

    let tagsMap = setSearchHashs([cheatsheet], allTags)

    let searchTags = tagsToOrderedHashs(['vs code', 'go'].map(tag => tagsMap[tag]))
    let isFoundCheatsheet = findTagsInOrderedTags(searchTags, cheatsheet.orderedTags)

    expect(isFoundCheatsheet).to.eq(true)
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
