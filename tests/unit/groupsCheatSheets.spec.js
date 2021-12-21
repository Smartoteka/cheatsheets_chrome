import { expect } from 'chai'
import { cheatsheetsGroup } from '../../src/src_jq/common/cheatSheetsManage'

describe('Cheatsheets group', () => {
  it('join two with equal part', () => {
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
    }]

    let groups = cheatsheetsGroup(cheatsheets)

    expect(groups.length).to.eq(1)
    expect(groups[0].commonTagsCount).to.eq(3)
    expect(groups[0].items.length).to.eq(2)
  })

  it('join 2 with not equal tags', () => {
    let cheatsheets = [{
      'content': '',
      'date': 1633335302157,
      'tags': [{
        'id': 'format',
        'text': 'format',
      }],
    }, {
      'content': '',
      'date': 1633338304074,
      'tags': [{
        'id': 'go',
        'text': 'go',
      }],
    }]

    let groups = cheatsheetsGroup(cheatsheets)

    expect(groups.length).to.eq(1)
    expect(groups[0].commonTagsCount).to.eq(0)
    expect(groups[0].items.length).to.eq(2)
  })

  it('join 3 with not equal tags', () => {
    let cheatsheets = [{
      'content': '',
      'date': 1633335302157,
      'tags': [{
        'id': 'format',
        'text': 'format',
      }],
    }, {
      'content': '',
      'date': 1633338304074,
      'tags': [{
        'id': 'go',
        'text': 'go',
      }],
    },
    {
      'content': '',
      'date': 1633338304074,
      'tags': [{
        'id': 't',
        'text': 't',
      }],
    }]

    let groups = cheatsheetsGroup(cheatsheets)

    expect(groups.length).to.eq(1)
    expect(groups[0].commonTagsCount).to.eq(0)
    expect(groups[0].items.length).to.eq(3)
  })

  it('join 2 with not equal tags and two to group', () => {
    let cheatsheets = [{
      'content': '',
      'date': 1633335302157,
      'tags': [{
        'id': 'format',
        'text': 'format',
      }],
    }, {
      'content': '',
      'date': 1633338304074,
      'tags': [{
        'id': 'go',
        'text': 'go',
      }],
    }, {
      'content': '',
      'date': 1633338304074,
      'tags': [{
        'id': 't',
        'text': 't',
      }],
    }, {
      'content': '',
      'date': 1633338304075,
      'tags': [{
        'id': 't',
        'text': 't',
      }],
    }]

    let groups = cheatsheetsGroup(cheatsheets)

    expect(groups.length).to.eq(2)
    expect(groups[0].commonTagsCount).to.eq(0)
    expect(groups[0].items.length).to.eq(2)

    expect(groups[1].commonTagsCount).to.eq(1)
    expect(groups[1].items.length).to.eq(2)
  })

  it('join 3. 1 and 2 equal 1 tag, 2 and 3 equal 2 tags', () => {
    let cheatsheets = [{
      'content': '1',
      'date': 1,
      'tags': [{
        'id': '1',
        'text': '1',
      }],
    }, {
      'content': '1 2',
      'date': 2,
      'tags': [{
        'id': '1',
        'text': '1',
      },
      {
        'id': '2',
        'text': '2',
      }],
    }, {
      'content': '1 2',
      'date': 3,
      'tags': [{
        'id': '1',
        'text': '1',
      },
      {
        'id': '2',
        'text': '2',
      }],
    }]

    let groups = cheatsheetsGroup(cheatsheets)

    expect(groups.length).to.eq(1)
    expect(groups[0].commonTagsCount).to.eq(1)
    expect(groups[0].items.length).to.eq(1)

    expect(groups[0].groups.length).to.eq(1)
    expect(groups[0].groups[0].items.length).to.eq(2)
  })

  it('join 4. 1 and 2 equal 1 tag, 2 and 3 equal 2 tags + NOT EQUAL', () => {
    let cheatsheets = [{
      'content': '',
      'date': 1,
      'tags': [{
        'id': '1',
        'text': '1',
      }],
    }, {
      'content': '',
      'date': 2,
      'tags': [{
        'id': '1',
        'text': '1',
      },
      {
        'id': '2',
        'text': '2',
      }],
    }, {
      'content': '',
      'date': 3,
      'tags': [{
        'id': '1',
        'text': '1',
      },
      {
        'id': '2',
        'text': '2',
      }],
    }, {
      'content': '',
      'date': 3,
      'tags': [{
        'id': '11',
        'text': '11',
      },
      {
        'id': '22',
        'text': '22',
      }],
    }]

    let groups = cheatsheetsGroup(cheatsheets)

    expect(groups.length).to.eq(2)
    expect(groups[0].commonTagsCount).to.eq(0)
    expect(groups[0].items.length).to.eq(1)

    expect(groups[1].commonTagsCount).to.eq(1)
    expect(groups[1].items.length).to.eq(1)

    expect(groups[1].groups.length).to.eq(1)
    expect(groups[1].groups[0].items.length).to.eq(2)
  })

  it('2 not queal should union to group', () => {
    let cheatsheets = [{
      'content': '',
      'date': 0,
      'tags': [{
        'id': '0',
        'text': '0',
      }],
    },
    {
      'content': '',
      'date': 1,
      'tags': [{
        'id': '1',
        'text': '1',
      }],
    }, {
      'content': '',
      'date': 2,
      'tags': [{
        'id': '1',
        'text': '1',
      },
      {
        'id': '2',
        'text': '2',
      }],
    }, {
      'content': '',
      'date': 3,
      'tags': [{
        'id': '1',
        'text': '1',
      },
      {
        'id': '2',
        'text': '2',
      }],
    }, {
      'content': '',
      'date': 4,
      'tags': [{
        'id': '11',
        'text': '11',
      },
      {
        'id': '22',
        'text': '22',
      }],
    }]

    let groups = cheatsheetsGroup(cheatsheets)

    expect(groups.length).to.eq(2)
    expect(groups[0].commonTagsCount).to.eq(0)
    expect(groups[0].items.length).to.eq(2)

    expect(groups[1].commonTagsCount).to.eq(1)
    expect(groups[1].items.length).to.eq(1)
    expect(groups[1].groups.length).to.eq(1)
    expect(groups[1].groups[0].items.length).to.eq(2)
  })

  it('Should be Chrome/api, shortcut', () => {
    let cheatsheets = [{
      'content': 'Chrome api 1',
      'date': 0,
      'tags': [{
        'id': 'Chrome',
        'text': 'Chrome',
      },
      {
        'id': 'Api',
        'text': 'Api',
      }],
    },
    {
      'content': 'Chrome api 2',
      'date': 0,
      'tags': [{
        'id': 'Chrome',
        'text': 'Chrome',
      },
      {
        'id': 'Api',
        'text': 'Api',
      }],
    },
    {
      'content': 'Chrome shortcut',
      'date': 1,
      'tags': [{
        'id': 'Chrome',
        'text': 'Chrome',
      },
      {
        'id': 'shortcut',
        'text': 'shortcut',
      }],
    }]

    let groups = cheatsheetsGroup(cheatsheets)

    console.log(JSON.stringify(groups, null, 2))

    expect(groups.length).to.eq(1)
    expect(groups[0].commonTagsCount).to.eq(1)
    expect(groups[0].items.length).to.eq(1)
    expect(groups[0].groups[0].items.length).to.eq(2)
  })

  it('Should be {not equal:{}, Chrome:{api:{tab:{}}, shortcut:{}}}', () => {
    let cheatsheets = [{
      'content': 'Chrome api 1',
      'date': 0,
      'tags': [{
        'id': 'a not equal',
        'text': 'a not equal',
      }],
    },
    {
      'content': 'Chrome api 1',
      'date': 0,
      'tags': [{
        'id': 'Chrome',
        'text': 'Chrome',
      },
      {
        'id': 'Api',
        'text': 'Api',
      }],
    },

    {
      'content': 'Chrome api tab 1',
      'date': 0,
      'tags': [{
        'id': 'Chrome',
        'text': 'Chrome',
      },
      {
        'id': 'Api',
        'text': 'Api',
      },
      {
        'id': 'tab',
        'text': 'tab',
      }],
    },
    {
      'content': 'Chrome api tab 2',
      'date': 0,
      'tags': [{
        'id': 'Chrome',
        'text': 'Chrome',
      },
      {
        'id': 'Api',
        'text': 'Api',
      },
      {
        'id': 'tab',
        'text': 'tab',
      }],
    },
    {
      'content': 'Chrome shortcut',
      'date': 1,
      'tags': [{
        'id': 'Chrome',
        'text': 'Chrome',
      },
      {
        'id': 'shortcut',
        'text': 'shortcut',
      }],
    }]

    let groups = cheatsheetsGroup(cheatsheets)

    expect(groups.length).to.eq(2)
    expect(groups[1].commonTagsCount).to.eq(1)
    expect(groups[1].items.length).to.eq(1)
    expect(groups[1].groups[0].items.length).to.eq(1)
  })

  let cheatsheetsChromeAPITab = [{
    'content': 'let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });',
    'date': 1632742974029,
    'tags': [{
      'id': 'Chrome',
      'text': 'Chrome',
    }, {
      'id': 'tab',
      'text': 'tab',
    }, {
      'id': 'active',
      'text': 'active',
    }, {
      'id': 'current',
      'text': 'current',
    }],
  }, {
    'content': 'let tab = await chorme.tabs.get(<tabId>);',
    'date': 1632743375178,
    'tags': [{
      'id': 'Chrome',
      'text': 'Chrome',
    }, {
      'id': 'tab',
      'text': 'tab',
    }, {
      'id': 'active',
      'text': 'active',
    }, {
      'id': 'get',
      'text': 'get',
    }],
  }, {
    'content': 'let tabs = chrome.tabs.getAllInWindow(<windowIdOrNullForCurrent>)',
    'date': 1632744991925,
    'tags': [{
      'id': 'Chrome',
      'text': 'Chrome',
    }, {
      'id': 'tab',
      'text': 'tab',
    }, {
      'id': 'all',
      'text': 'all',
    }],
  }, {
    'content': 'let tabs = chrome.tabs.query({windowId:<windowIdOrNullForCurrent>/*or currentWindow:true*/})',
    'date': 1632745090332,
    'tags': [{
      'id': 'Chrome',
      'text': 'Chrome',
    }, {
      'id': 'V3',
      'text': 'V3',
    }, {
      'id': 'tab',
      'text': 'tab',
    }, {
      'id': 'get',
      'text': 'get',
    }],
  }]
  it('Why i have 2 recodrs after group?', () => {
    let groups = cheatsheetsGroup(cheatsheetsChromeAPITab)

    console.log(JSON.stringify(groups))

    expect(groups.length).to.eq(1)
  })
})
