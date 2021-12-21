import Fuse from '@/src_jq/libraries/fuse'

export default function createMultiselectTags(selector, tags, helpTags) {
  tags = tags.filter(el => el.id)
  let multilist = $(selector)

  let select2List = multilist.select2({
    width: '100%',
    multiple: true,
    tags: true,
    dragAndDropTags: true,
    tokenSeparators: [','],
    placeholder: 'Click here and start typing to search.',
    data: tags,
    templateResult: (element) => {
      if (element.unionTag) {
        let html = $('<span style="color:green">' + element.text + '</span>')

        return html
      }

      if (element.newTag) {
        let html = $('<span style="color:#1a0dab">' + element.text + '</span>')

        return html
      }

      return element.text
    },
    createTag: function (params) {
      let term = $.trim(params.term)

      if (term === '') {
        return null
      }

      if (!params.tokenize && helpTags) {
        let tags = helpTags(params, multilist.select2('data').map(el => el.text))

        if (params.finded) { return tags.length ? tags : null }

        return [
          {
            id: term,
            text: term,
            tag: true,
            newTag: true,
            score: 0,
          },
          ...tags]
      }

      if (!params.finded) {
        return {
          id: term,
          text: term,
          tag: true,
          newTag: true,
          score: 0,
        }
      }

      return null
    },
    insertTag: function (data, tag) {
      // Insert the tag at the end of the results
      data.push(tag)
    },
    matcher: (term, text) => {
      if (!term.term) {
        let tags = $(selector).select2('data').map(el => el.text)

        let currentState = tags.join(',') + ',' + term.term
        if (multilist.lastSearch !== currentState) {
          if (tags.length > 0) {
            multilist.searchedRows = window.getAdditionalTags(tags).map(el => ({ item: { id: el } }))
          }

          multilist.lastSearch = currentState
        }
      } else if (multilist.lastSearch !== term.term) {
        initFuzzySearch.call(this, term)
        multilist.lastSearch = term.term
      }

      let find = (multilist.searchedRows || []).find(el => el.item.id === text.id)
      if (find) {
        text.score = find.score
        return text
      }

      return null
    },
    sorter: (data) => data.filter(function (item) {
      return !!item
    }).sort((a, b) => {
      let score = b.score < a.score
        ? 1
        : (b.score > a.score) ? -1 : 0

      return score || (a.text.localeCompare(b.text))
    }),
  })

  function initFuzzySearch(term) {
    let tags = []

    $('option', multilist)
      .each(function () {
        tags.push({
          id: $(this).attr('value'), // TODO:val() throw Cannot read properties of undefined (reading 'toLowerCase')
          text: $(this).text(),
        })
      })

    const options = {
      includeScore: true,
      useExtendedSearch: true,
      keys: ['text'],
    }

    const fuse = new Fuse(tags, options)

    multilist.searchedRows = fuse.search(term.term)
  }

  return select2List
}
