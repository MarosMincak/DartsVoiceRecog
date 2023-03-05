let website_data = []
let commands = []

function registerCommand(name, oncommand) {
  if(commands.find(o => o.name == name) != undefined) {
    return;
  }
  commands.push({
    name: name,
    oncommand: oncommand
  })
}

function toBoolean(str) {
  if(str == "true") {
    return true;
  }
  return false;
}

chrome.runtime.onMessage.addListener((message, sender, res) => {
  let segments = message.split(" ");
  var name = ""
  var args = []
  for(var i = 0; i < segments.length; i++) {
    if(i == 0) {
      name = segments[i];
    }else {
      args.push(segments[i]);
    }
  }
  if(commands.find(o => o.name == name) == undefined) {
    res("undefined")
  }else {
    res(commands.find(o => o.name == name).oncommand(name, args))
  }
})

registerCommand("getdata", (name, args) => {
  if(args.length == 3) {
    if(args[0] == "window") {
      if(args[1] == "status") {
        if(website_data.find(o => o.webid == args[2]) == undefined) {
          return false;
        }else {
          return website_data.find(o => o.webid == args[2]).status;
        }
      }else {
        return "undefined";
      }
    }else {
      return "undefined";
    }
  }else {
    return "undefined";
  }
})

registerCommand("setdata", (name, args) => {
  if(args.length == 4) {
    if(args[0] == "window") {
      if(args[1] == "status") {
        if(website_data.find(o => o.webid == args[2]) == undefined) {
          website_data.push({
            webid: args[2],
            status: toBoolean(args[3])
          })
          return true;
        }else {
          website_data.find(o => o.webid == args[2]).status = toBoolean(args[3])
          return true;
        }
      }else {
        return "undefined";
      }
    }else {
      return "undefined";
    }
  }else {
    return "undefined";
  }
})