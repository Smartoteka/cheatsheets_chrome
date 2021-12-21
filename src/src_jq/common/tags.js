function getTags(url, title) {
    const tagsMap = {
      "www.google.com": "GOOGLE",
      "ag-grid": "agGrid",
      "aggrid": "agGrid",
      "javascript": "JavaScript",
      "developer.chrome.com/docs/extensions": "Chrome extension api"
    };
  
    let tags = [];
    for (const [searchTag, tag] of Object.entries(tagsMap)) {
  
      if (url.indexOf(searchTag) !== -1 || title.toLowerCase().indexOf(searchTag) !== -1) {
        tags.push(tag);
      }
    }
  
    return tags;
  }