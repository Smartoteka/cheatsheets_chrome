import SearchDriver from '@/src_jq/common/searchDriver'

chrome.runtime.onMessage.addListener((tags) => {
  console.log(tags)

  let docs = getDocumentsOnPage()

  console.log(docs)

  let searchDriver = new SearchDriver()

  searchDriver.init(docs)
  let result = searchDriver.search(tags)

  console.log(result)

  document.querySelectorAll('article>*').forEach(el => {
    el.style.display = 'none'

    if (el.tagName === 'TABLE') {
      el.querySelectorAll('tr').forEach(tr => { tr.style.display = 'none' })
    }

    if (el.tagName === 'UL') {
      el.querySelectorAll('li').forEach(tr => { tr.style.display = 'none' })
    }
  })

  result.forEach(el => {
    el.domEls.forEach(domEl => { domEl.style.removeProperty('display') })
  })

  if (result.length > 0) {
    result[0].domEls[0].scrollIntoView()
  }
})

function getDocumentsOnPage() {
  let docs = []
  let markdown = Array.from(document.querySelector('article').children)

  let tagStack = []
  let content = ''

  let domEls = []

  const addDoc = (content, tags, isEndTag) => {
    if (domEls.length === 0) {
      throw new Error('Dom elements is empty')
    }
    const newElement = {
      id: docs.length + 1,
      content: content,
      tags: tags,
      domEls: domEls.length === 1 ? domEls.slice() : domEls.splice(0, domEls.length + (isEndTag ? -1 : 0)),
    }

    if (newElement.domEls.length === 0) {
      throw new Error('newElement Dom elements is empty')
    }
    docs.push(newElement)

    return newElement
  }

  const endTag = () => {
    let newElement = null
    if (content) {
      newElement = addDoc(
        content,
        tagStack.map(tag => tag.innerText),
        true,
      )
    }
    content = domEls.length === 0 ? '' : domEls.map(el => el.innerText).join(' ')

    return newElement
  }

  markdown.forEach(el => {
    domEls.push(el)
    if (el.tagName.startsWith('H')) {
      // console.log(el.tagName + ' ' + el.innerText)

      endTag()
      // debugger
      while (
        tagStack.length > 0
          && tagStack[tagStack.length - 1].tagName >= el.tagName) {
        tagStack.pop()
      }

      tagStack.push(el)
    } else if (el.tagName === 'P'
        || el.tagName === 'BLOCKQUOTE') {
      content += ' ' + el.innerText
    } else if (el.tagName === 'BR') {
      // Ignore
    } else if (el.tagName === 'DIV') {
      // console.log('------- DIV ' + el.innerText)
    } else if (el.tagName === 'TABLE') {
      let beforeTable = endTag()
      // TODO: хорошо добавить проверку перед таблицей информация относится к ней или нет. как это сделать?

      let tableHeader = el.querySelectorAll('thead tr')[0]
      beforeTable.domEls.push(tableHeader)

      Array.from(el.querySelectorAll('tbody tr')).forEach(row => {
        beforeTable.domEls.push(row)

        domEls.push(el)
        domEls.push(tableHeader)
        domEls.push(row)

        addDoc(
          row.innerText,
          tagStack.map(tag => tag.innerText),
        )
      })
    } else if (el.tagName === 'UL') {
      let beforeTable = endTag()

      Array.from(el.querySelectorAll('li')).forEach(row => {
        beforeTable.domEls.push(row)

        domEls.push(beforeTable.domEls[0])
        domEls.push(el)
        domEls.push(row)

        addDoc(
          row.innerText,
          tagStack.map(tag => tag.innerText),
        )
      })
    } else if (el.tagName === 'A') {
      if (el.innerText) {
        endTag()
        // debugger
        addDoc(
          el.innerText,
          [...tagStack.map(tag => tag.innerText), el.attributes.href],
        )
      }
    } else {
      console.log('Unexpected tag ' + el.tagName + ' ' + el.innerText)
    }
  })

  return docs
}

export default { getDocumentsOnPage }
