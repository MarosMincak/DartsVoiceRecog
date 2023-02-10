var selectedDialect = "sk-SK",
    recognition;

window.speechToText = function () {
  // Check if the browser supports the SpeechRecognition API
  if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    // Set interimResults to true to receive results as they are recognized
    recognition.interimResults = true;

    // Set the language for the recognition
    //recognition.lang = select_dialect.value;
    recognition.lang = selectedDialect;

    var interim_transcript = "";
    var transcript = "";

    // // Create a function to handle the result event
    recognition.onresult = function (event) {
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
      console.log(event.results);

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
    };

    recognition.onerror = function (event) {
      errorHandle(event);
    }

    // Define the stop function as a method of the recognition object
    recognition.stop = function () {
      recognition.abort();
    };
  } else {
    alert("Hello! I am an alert box!!");
  }
  // We should start recognition after each pause
// Other way it will just stop recognizing forever (till the next page load)
recognition.addEventListener('end', recognition.start);

// Starting recognition first time
recognition.start();
};
//new code!

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