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

function runCommand(cmd) {
  let segments = cmd.split(" ");
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
    return "undefined"
  }else {
    return commands.find(o => o.name == name).oncommand(name, args)
  }
}

chrome.runtime.onMessage.addListener((message, sender, res) => {
  res(runCommand(message))
})

registerCommand("getwindow", (name, args) => {
  if(args.length == 1) {
    if(website_data.find(o => o.webid == args[0]) == undefined) {
      return {
        status: false,
        lang: "sk-SK",
        dialect: ""
      };
    }else {
      return website_data.find(o => o.webid == args[0]);
    }
  }else {
    return "undefined";
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
      }else if(args[1] == "lang") {
        if(website_data.find(o => o.webid == args[2]) == undefined) {
          return "sk-sk";
        }else {
          return website_data.find(o => o.webid == args[2]).lang;
        }
      }else if(args[1] == "dialect") {
        if(website_data.find(o => o.webid == args[2]) == undefined) {
          return "";
        }else {
          return website_data.find(o => o.webid == args[2]).dialect;
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
            status: toBoolean(args[3]),
            lang: "sk-sk",
            dialect: ""
          })
          return true;
        }else {
          website_data.find(o => o.webid == args[2]).status = toBoolean(args[3])
          return true;
        }
      }else if(args[1] == "lang") {
        if(website_data.find(o => o.webid == args[2]) == undefined) {
          website_data.push({
            webid: args[2],
            status: false,
            lang: args[3],
            dialect: ""
          })
          return true;
        }else {
          website_data.find(o => o.webid == args[2]).lang = args[3]
          return true;
        }
      }else if(args[1] == "dialect") {
        if(website_data.find(o => o.webid == args[2]) == undefined) {
          website_data.push({
            webid: args[2],
            status: false,
            lang: "sk-sk",
            dialect: args[3]
          })
          return true;
        }else {
          website_data.find(o => o.webid == args[2]).dialect = args[3]
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