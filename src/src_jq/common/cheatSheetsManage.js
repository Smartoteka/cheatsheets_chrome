import {
  comparerFunc, comparerCombine, comparerFuncDesc, comparer,
} from './rateTags'

function sternBrokoComparer(a, b) {
  let na = a.d + b.n; let nb = a.n + b.d

  return comparer(na, nb)
}
export function getSternBrokoByPos(array, l, r) {
  if (r - l === 0 || r - l === 1 && array[r] || l + 1 === array.length) {
    // console.log('return ' + l + ' ' + r)
    return null
  }
  let lv = l < 0 ? { n: 0, d: 1 } : array[l]
  let rv = r === array.length ? { n: 1, d: 0 } : array[r]

  let n = lv.n + rv.n
  let d = lv.d + rv.d

  // console.log(JSON.stringify({
  //   l, r, n, d, p,
  // }))
  return { n: n, d: d }
}
export function buildSternBrokkoTree(array, l, r) {
  let dn = getSternBrokoByPos(array, l, r)

  if (!dn) { return }

  let p = Math.ceil((l + r) / 2)
  array[p].n = dn.n
  array[p].d = dn.d

  buildSternBrokkoTree(array, p, r)
  buildSternBrokkoTree(array, l, p)
}

function clearGroups(groups) {
  for (let i = 0; i < groups.length; i++) {
    let group = groups[i]

    while (group.items.length === 0 && group.groups.length === 1) {
      group = group.groups[0]
    }

    groups[i] = group
    delete group.parent

    clearGroups(group.groups)
  }
}

// eslint-disable-next-line import/prefer-default-export
export function autoCheatsheetsGroup(cheatsheets) {
  if (cheatsheets.length === 0) {
    return []
  }

  cheatsheets.forEach(ch => {
    let tags = ch.tags
    ch.joinTags = (tags || []).map(el => el.id).join(',') + ',,'
  })

  cheatsheets = cheatsheets.sort((a, b) => a.joinTags.localeCompare(b.joinTags))

  function compareTags(tags1, tags2) {
    let i = 0
    for (; i < tags1.length && i < tags2.length; i++) {
      if (tags1[i].id !== tags2[i].id) return i
    }

    return i
  }

  let prev = cheatsheets[0]
  let id = 1
  let prevGroup = {
    id: ++id,
    items: [prev],
    commonTagsCount: 0,
    groups: [],
    parent: null,
  }

  let firstEmptyGroup = prevGroup

  let groups = [prevGroup]

  for (let i = 1; i < cheatsheets.length; i++) {
    let current = cheatsheets[i]

    let commonTagsCount = compareTags(current.tags, prev.tags)

    if (prevGroup.commonTagsCount === commonTagsCount) {
      prevGroup.items.push(current)
    } else if (prevGroup.commonTagsCount < commonTagsCount) {
      prevGroup.items.pop()

      let diff = commonTagsCount - prevGroup.commonTagsCount
      for (let i = 1; i < diff; i++) {
        let currentGroup = {
          id: ++id,
          items: [],
          commonTagsCount: prevGroup.commonTagsCount + 1,
          groups: [],
          parent: prevGroup,
        }

        if (prevGroup.commonTagsCount === 0) {
          groups.push(currentGroup)
        } else {
          prevGroup.groups.push(currentGroup)
        }

        prevGroup = currentGroup
      }
      let currentGroup = {
        id: ++id,
        items: [prev, current],
        commonTagsCount: commonTagsCount,
        groups: [],
        parent: prevGroup,
      }

      if (prevGroup.commonTagsCount === 0) {
        groups.push(currentGroup)
      } else {
        prevGroup.groups.push(currentGroup)
      }

      prevGroup = currentGroup
    } else {
      if (commonTagsCount === 0) {
        prevGroup = firstEmptyGroup
      } else {
        let dif = prevGroup.commonTagsCount - commonTagsCount

        for (let j = 0; j < dif; j++) {
          prevGroup = prevGroup.parent
        }
      }

      if (prevGroup) {
        prevGroup.items.push(current)
      } else {
        let currentGroup = {
          id: ++id,
          items: [current],
          commonTagsCount: commonTagsCount,
          groups: [],
          parent: null,
        }

        groups.push(currentGroup)
        prevGroup = currentGroup
      }
    }

    prev = current
  }

  clearGroups(groups)

  groups = groups.filter(el => el.items.length !== 0 || el.groups.length !== 0)

  return groups
}

export function tagsToOrderedHashs(tags) {
  return tags.map(el => el.uid).sort(comparerFunc((el) => el))
}

export function setSearchHashs(cheatsheets, allTags) {
  if (!allTags) {
    allTags = Array.prototype.concat.apply([], cheatsheets.filter(el => el.tags).map(el => el.tags))
  }
  let tagsMap = {}

  allTags.forEach(tag => {
    tag.uid = hashCode(tag.id.toLowerCase())

    tagsMap[tag.id] = tag
  })

  cheatsheets.forEach(cheatsheet => {
    cheatsheet.tags = cheatsheet.tags.map(tag => tagsMap[tag.id])

    cheatsheet.orderedTags = tagsToOrderedHashs(cheatsheet.tags)
  })

  return tagsMap
}

export function hashCode(str) {
  str = str.toLowerCase()

  let hash = 0; let i; let
    chr
  if (str.length === 0) return hash
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

export function findTagsInOrderedTags(findTags, orderedTags) {
  if (findTags.length > orderedTags.length) { return false }

  for (let findTagsIndex = 0, orderedTagsIndex = 0; findTagsIndex < findTags.length; findTagsIndex++) {
    const findTag = findTags[findTagsIndex]
    while (findTag > orderedTags[orderedTagsIndex] && orderedTagsIndex < orderedTags.length) {
      orderedTagsIndex += 1
    }

    if (orderedTagsIndex === orderedTags.length
      || findTag !== orderedTags[orderedTagsIndex]) {
      return false
    }
  }

  return true
}

export function cheatsheetsGroupByPreparedGroups(cheatsheets, tagsCount) {
  if (cheatsheets.length === 0) {
    return []
  }

  // eslint-disable-next-line no-return-assign
  cheatsheets.forEach(ch => ch.inGroup = false)

  let id = 1
  let groups = cheatsheets.filter(el => el.type === 'group' && el.tags && el.tags.length)
    .sort(comparerFunc(gr => gr.tags.length))

  groups
    .forEach(gr => {
      if (gr.tags.length <= tagsCount) return

      let items = cheatsheets.filter(ch => !ch.inGroup
        && gr.id !== ch.id
        && gr.orderedTags
        && ch.orderedTags
        && findTagsInOrderedTags(gr.orderedTags, ch.orderedTags))

      items.forEach(ch => {
        ch.inGroup = true
      })
    })

  let returnGroups = [{

    id: parseInt((++id), 10),
    items:
      cheatsheets
        .filter(el => !el.inGroup)
        .sort(
          comparerCombine([
            comparerFuncDesc(
              ch => ch.type,
            ),
            sternBrokoComparer,
          ]),
        ),
    commonTagsCount: 0,
    groups: [],
  }]

  // if (returnGroups[0].items.length === 1) {
  //   returnGroups[0].items = returnGroups[0].items.concat(cheatsheets.filter(el => el.type !== 'group'))
  // }
  // groups = groups.filter(el => !el.inGroup && (el.items.length !== 0 || el.groups.length !== 0))

  return returnGroups
}
