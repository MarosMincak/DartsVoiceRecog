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
    window.dartsvoice.reloadLang(default_language)

    window.dartsvoice.recognition.onresult = window.dartsvoice.onvoicedetect;
    window.dartsvoice.recognition.onerror = window.dartsvoice.onvoiceerror;
    window.dartsvoice.recognition.stop = window.dartsvoice.onvoicestop;
    window.dartsvoice.recognition.addEventListener('end', window.dartsvoice.start);
    window.dartsvoice.status = "success_loaded"
    window.dartsvoice.start()
    chrome.runtime.sendMessage("setdata window status "+windowid + " true", (res) => {});
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
  console.log(event.results[0][0]);

  // Filter the transcription to keep only the digits
  transcript = transcript.replace(/[^0-9]/g, "");
  interim_transcript = transcript.replace(/[^0-9]/g, "");

  // Log the filtered transcription to the console
  console.log(transcript);

  console.log("\n");
  document.querySelector(".input_area").innerHTML = interim_transcript;
  document.querySelector(".input_area").innerHTML = transcript;

  // Press enter
  enterResult(transcript);
}

window.dartsvoice.onvoiceerror = function(event) {
  errorHandle(event);
}

window.dartsvoice.onvoicestop = function(event) {
  window.dartsvoice.recognition.abort();
}

window.dartsvoice.reloadLang = function(lang) {
  window.dartsvoice.recognition.lang = lang
}

window.dartsvoice.start = function() {
  window.dartsvoice.recognition.start();
}

window.dartsvoice.stop = function() {
  window.dartsvoice.recognition.stop();
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
      console.error("There was a network error");
      break;
    case "not-allowed":
      console.error("The user has denied permission to use the microphone");
      break;
    case "service-not-allowed":
      console.error(
        "The user has denied permission to use the speech recognition service"
      );
      break;
    default:
      console.error(event.error);
  }
}