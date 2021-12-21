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
export function cheatsheetsGroup(cheatsheets) {
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

// window.cheatsheetsGroup = cheatsheetsGroup;
