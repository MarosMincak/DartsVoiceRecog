const debug = false;
function debugMessage(object, level) {
  if(!debug) {
    return;
  }
  switch(level) {
    case "error":
      console.error(object);
      break;
    default:
      console.log(object);
      break;
  }
}
var selectedDialect = "sk-SK",
    recognition;

let default_language = "sk-SK";

window.dartsvoice = {}
window.dartsvoice.recognition = 0;
window.dartsvoice.status = "unloaded";

window.dartsvoice.load = function(windowid, force) {
  window.dartsvoice.windowid = windowid
  if(window.dartsvoice.status == "success_loaded" && !force) {
    alert("Already loaded")
    return
  }
  // Check if the browser supports the SpeechRecognition API
  if("webkitSpeechRecognition" in window) {
    window.dartsvoice.recognition = new webkitSpeechRecognition();
    // Set interimResults to true to receive results as they are recognized
    window.dartsvoice.recognition.interimResults = true;
    //Set the language for recognition
    
    chrome.runtime.sendMessage("getwindow "+windowid, (res) => {
       window.dartsvoice.reloadLang(res.lang)

       window.dartsvoice.recognition.onresult = window.dartsvoice.onvoicedetect;
      window.dartsvoice.recognition.onerror = window.dartsvoice.onvoiceerror;
      window.dartsvoice.recognition.stop = window.dartsvoice.onvoicestop;
      window.dartsvoice.recognition.addEventListener('end', () => {
        window.dartsvoice.start(false);
      });
      window.dartsvoice.status = "success_loaded"
      window.dartsvoice.start(true)
      chrome.runtime.sendMessage("setdata window status "+windowid + " true", (res) => {});
    });
  }else {
    window.dartsvoice.status = "failed_unsupported"
  }
}

window.dartsvoice.onvoicedetect = function(event) {
  var interim_transcript = "";
  var transcript = "";

  // Get the transcription of the speech
  for (var i = event.resultIndex; i < event.results.length; i++) {
    if (event.results[i].isFinal) {
      transcript += event.results[i][0].transcript;
    } else {
      interim_transcript += event.results[i][0].transcript;
    }
  }
  debugMessage(event.results[0][0]);

  // Filter the transcription to keep only the digits
  transcript = transcript.replace(/[^0-9]/g, "");
  interim_transcript = transcript.replace(/[^0-9]/g, "");

  // Log the filtered transcription to the console
  debugMessage(transcript);

  document.querySelector(".input_area").innerHTML = interim_transcript;
  document.querySelector(".input_area").innerHTML = transcript;

  // Press enter
  enterResult(transcript);
}

window.dartsvoice.onvoiceerror = function(event) {
  errorHandle(event);
}

window.dartsvoice.onvoicestop = function(event) {
  //window.dartsvoice.recognition.abort();
}

window.dartsvoice.reloadLang = function(lang) {
  window.dartsvoice.recognition.lang = lang
}

window.dartsvoice.start = function(force) {
  if(force) {
    window.dartsvoice.recognition.start();
  }else {
    if(window.dartsvoice.status == "success_loaded") {
      window.dartsvoice.recognition.start();
    }
  }
}

window.dartsvoice.stop = function() {
  if(window.dartsvoice.status != "success_loaded") {
    return;
  }
  window.dartsvoice.recognition.abort();
  window.dartsvoice.recognition = undefined;
  window.dartsvoice.status = "unloaded";
  chrome.runtime.sendMessage("setdata window status "+window.dartsvoice.windowid + " false", (res) => {});
}

// detect new selected dialect
chrome.storage.local.get('dialectCode', function (items) {
  selectedDialect = items.dialectCode

  chrome.storage.local.remove('dialectCode');
});

function enterResult(transcript) {
  document.querySelector(".input_area").dispatchEvent(
    new KeyboardEvent("keydown", {
      code: "Enter",
      key: "Enter",
      charCode: 13,
      keyCode: 13,
      view: window,
      bubbles: true,
    })
  );
}

function errorHandle(event) {
  switch (event.error) {
    case "network":
      debugMessage("There was a network error", "error");
      break;
    case "not-allowed":
      debugMessage("The user has denied permission to use the microphone", "error");
      break;
    case "service-not-allowed":
      debugMessage("The user has denied permission to use the speech recognition service", "error");
      break;
    case "aborted":
      break;
    default:
      debugMessage(event.error, "error");
  }
}