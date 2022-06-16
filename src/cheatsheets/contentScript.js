chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request)

  switch (request.cmd) {
    case 'getYoutubeCurrentTime':
    {
      const video = document.querySelector('#ytd-player video')
      if (video) {
        sendResponse({
          success: true,
          currentTime: video.currentTime,
        })
      } else {
        sendResponse({
          success: false,
          message: 'not found youtube player',
        })
      }
      break
    }
    default: {
      throw new Error('Unexpected command ' + request.cmd)
    }
  }
})
