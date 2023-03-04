let website_data = []

chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.executeScript({
    code: 'window.speechToText()'
  });
});
chrome.runtime.onMessage.addListener((message, sender, res) => {
  if(message.startsWith("web-winodow-update-")) {
    let id = message.substring(19, message.length);
    if(website_data.find(o => o.webid == id) != undefined) {
      website_data.find(o => o.webid == id).status = false;
      res(false);
      return;
    }else {
      website_data.push({
        url: sender.origin,
        webid: id,
        status: true
      })
      res(true)
      return;
    }
  }else if(message.startsWith("get-web-winodow-update-")) {
    let id = message.substring(23, message.length);
    if(website_data.find(o => o.webid == id) != undefined) {
      res(website_data.find(o => o.webid == id).status);
      return;
    }else {
      res(false)
      return;
    }
  }
  res("Not found 404")
})