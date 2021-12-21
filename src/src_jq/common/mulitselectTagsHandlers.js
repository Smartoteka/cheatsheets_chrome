import jQuery from 'jquery'
import { orderByRate, takeByRate } from '@/src_jq/common/rateTags'
import { unique } from '@/src_jq/common/commonFunctions'

if (!window.$) {
  window.$ = jQuery
}
let $ = window.$

export function getFilterByFilterTags(getData, getFilterTags) {
  return (node) => {
    let data = getData(node)

    return !data
      || !data.tags
      || data.tags.filter(tag => getFilterTags()[tag.id]).length === getFilterTags().count
  }
}

export function getFilterByTags() {
  return getFilterByFilterTags((node) => node.data, () => window.filterTags || { count: 0 })
}

export function registerFilterToGrid(grid) {
  $('#filter-tags').on('change', function (e) {
    window.filterTags = { count: 0 }

    let filterTags = $('#filter-tags')
      .select2('data')
      .map(el => el.text)

    let countTags = 0
    unique(filterTags, el => el)
      .map(tag => {
        countTags += 1
        window.filterTags[tag] = countTags

        return 0
      })

    window.filterTags.count = countTags

    grid.api.onFilterChanged()
  })
}

export function select2UpdateTags(selector, tags) {
  const select2 = $(selector)
  let dataAdapter = select2.data('select2').dataAdapter

  tags.map(el => ({ id: el.id, text: el.text }))
    .forEach(tag => dataAdapter.select(tag))
  // Store order
  select2
    .select2('data')
    .forEach(v => {
      v.index = tags.findIndex(t => t.id === v.id)
      v.text = tags[v.index].text
    })

  select2.trigger('change')
}

export function select2ClearTags(selector) {
  const select2 = $(selector)
  select2.val(null).trigger('change')
}

$('#clear-filter-tags-btn').click(_ => {
  select2ClearTags('#filter-tags')
})

setTimeout(() => {
  $('.select2-search__field, .select2-search').keydown(function (e) {
    if (e.code === 'Escape') {
      setTimeout(() => $(document.activeElement).blur())

      return
    }
    switch (e.key) {
      case '~':
        e.preventDefault()
        if ($(document.activeElement).attr('aria-describedby') === 'select2-add-tags-container') {
          select2ClearTags('#add-tags')
        } else {
          select2ClearTags('#filter-tags')
        }
        break
      default:
        break
    }
  })
}, 100)

$('#add-block-switch').click(function () {
  $(this).html(
    'Add\\Edit&nbsp;' + ($('#add-block').toggle().is(':hidden') ? '&#8595;' : '&#8593;'),
  )
})

$(document).keypress(function (e) {
  if (e.code === 'Escape') {
    setTimeout(() => $(document.activeElement).blur())
    return
  }

  if (document.activeElement.type === 'textarea'
    || document.activeElement.type === 'text') { return }

  switch (e.key) {
    case 'f':
      setTimeout(() => $('#filter-tags').focus(), 0)
      break
    case 'a':
      $('#add-block').show()
      setTimeout(() => $('#add-content').focus())
      break
    default:
      break
  }
})

export function generateAdditionalTagsFunction(getRows) {
  function buildSearchArray(rows, selectedTags, nextLevel) {
    let arrayTagArrays = rows
      .filter(el => el.tags)
      .map(r => {
        let compare = (a, b) => {
          let aId = window.restrictMap[a.text]
          let bId = window.restrictMap[b.text]

          if (aId === undefined) {
            if (bId === undefined) {
              return a.text.localeCompare(b.text)
            }
            return 1
          }

          if (bId === undefined) {
            return -1
          }

          return aId.localeCompare(bId)
        }

        return r.tags.sort(compare)
      })

    let tagPrefixMap = {}// TODO: нужно ли делать проверку что все выделенные тэги в массивах?

    for (let i = 0; i < arrayTagArrays.length; i++) {
      let tags = arrayTagArrays[i]

      if (tags.length <= selectedTags.length + (nextLevel ? 0 : 1)) { continue }

      let prefix = ''
      let prefixLength = 0
      for (let j = 0; j < tags.length; j++) {
        let currentTag = tags[j].text

        if (selectedTags.indexOf(currentTag) >= 0) { continue }

        prefix += currentTag + ','
        prefixLength += 1

        if (j === 0 || !nextLevel && prefixLength < 2) {
          continue
        }

        let prefixMap = tagPrefixMap[currentTag] || { count: 0, prefixes: {} }
        tagPrefixMap[currentTag] = prefixMap

        prefixMap.count += 1
        prefixMap.prefixes[prefix] = (prefixMap.prefixes[prefix] || 0) + 1

        if (nextLevel) { break }
      }
    }

    let arrayToSearch = []

    for (let tag in tagPrefixMap) {
      let prefixMap = tagPrefixMap[tag]

      for (let prefix in prefixMap.prefixes) {
        // if (!nextLevel && prefixMap.count === 1)
        //   continue;

        arrayToSearch.push({
          tag: tag,
          tagCount: prefixMap.count,
          prefix: prefix,
          prefixCount: prefixMap.prefixes[prefix],
        })
      }
    }

    return arrayToSearch
  }

  window.getAdditionalTags = function (selectedTags) {
    let rows = getRows()

    let arrayToSearch = buildSearchArray(rows, selectedTags, true)

    return arrayToSearch.map(el => el.tag)
  }

  function generateAdditionalTags(params, selectedTags) {
    let term = $.trim(params.term)

    if (term === '' || term.length < 2) {
      return []
    }

    let rows = getRows()

    let arrayToSearch = buildSearchArray(rows, selectedTags)

    let result = orderByRate(arrayToSearch, term)

    let take = takeByRate(result)

    return take
      .map(el => {
        let value = el.prefix.substring(0, el.prefix.length - 1)

        return {
          id: value,
          text: value, // TODO: maybe add description about this variant
          newTag: true,
          unionTag: true,
          score: 0.01 + el.rate * 0.01,
        }
      })
  }

  return generateAdditionalTags
}
