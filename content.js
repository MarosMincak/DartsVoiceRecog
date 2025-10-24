const DEBUG = false;

const log = (value, level = "log") => {
  if (!DEBUG) {
    return;
  }

  const logger = console[level] || console.log;
  logger.call(console, value);
};

(() => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const INPUT_SELECTOR = ".input_area";
  const FATAL_ERRORS = new Set(["not-allowed", "service-not-allowed"]);
  const ENTER_EVENT_INIT = {
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    charCode: 13,
    which: 13,
    bubbles: true,
  };

  const state = {
    recognition: null,
    shouldAutoRestart: false,
    windowId: null,
    lang: "sk-SK",
    status: "idle",
    lastSubmitted: "",
  };

  const extractScore = (text) => {
    if (!text) {
      return "";
    }
    const matches = text.match(/\d+/g);
    if (!matches) {
      return "";
    }
    const candidate = matches[matches.length - 1];
    const numeric = parseInt(candidate, 10);
    if (Number.isNaN(numeric)) {
      return "";
    }
    const clamped = Math.min(Math.max(numeric, 0), 180);
    return String(clamped);
  };

  const findInput = () => document.querySelector(INPUT_SELECTOR);

  const setFieldValue = (field, value) => {
    if (!field) {
      return false;
    }

    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      field.value = value;
      return true;
    }

    if (field.isContentEditable) {
      field.textContent = value;
      return true;
    }

    if (typeof field.value !== "undefined") {
      try {
        field.value = value;
        return true;
      } catch (error) {
        log(error, "warn");
      }
    }

    field.textContent = value;
    return true;
  };

  const updateInterimValue = (value) => {
    if (!value) {
      return false;
    }
    const input = findInput();
    if (!input) {
      return false;
    }
    return setFieldValue(input, value);
  };

  const submitScore = (value) => {
    if (!value) {
      return false;
    }

    const input = findInput();
    if (!input) {
      log("Input area not found; unable to submit value.", "warn");
      return false;
    }

    setFieldValue(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));

    if (typeof input.focus === "function") {
      input.focus({ preventScroll: true });
    }

    ["keydown", "keypress", "keyup"].forEach((type) => {
      input.dispatchEvent(new KeyboardEvent(type, ENTER_EVENT_INIT));
    });

    state.lastSubmitted = value;
    return true;
  };

  const notifyBackground = (isRunning, extra = {}) => {
    if (state.windowId === null || typeof chrome === "undefined") {
      return;
    }

    chrome.runtime.sendMessage({
      scope: "dartsvoice",
      type: "window:update",
      windowId: state.windowId,
      patch: {
        status: isRunning,
        lang: state.lang,
        lastError: extra.error || null,
      },
    });
  };

  const handleResult = (event) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const { transcript } = event.results[i][0];
      if (!transcript) {
        continue;
      }

      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    const interimScore = extractScore(interimTranscript);
    const finalScore = extractScore(finalTranscript);

    if (interimScore) {
      updateInterimValue(interimScore);
    }

    if (finalScore && finalScore !== state.lastSubmitted) {
      submitScore(finalScore);
    }
  };

  const handleError = (event) => {
    if (!event) {
      return;
    }

    log(event, "error");

    if (FATAL_ERRORS.has(event.error)) {
      state.shouldAutoRestart = false;
      notifyBackground(false, { error: event.error });
    }
  };

  const handleEnd = (event) => {
    if (state.recognition !== event.target) {
      return;
    }

    if (state.shouldAutoRestart) {
      try {
        event.target.start();
        state.status = "running";
        return;
      } catch (error) {
        log(error, "error");
        state.shouldAutoRestart = false;
        notifyBackground(false, { error: error.message });
      }
    }

    state.recognition = null;
    state.status = "idle";

    if (state.windowId !== null) {
      state.windowId = null;
      state.lastSubmitted = "";
    }
  };

  const stopRecognition = (options = {}) => {
    const recognition = state.recognition;
    if (!recognition) {
      state.shouldAutoRestart = false;
      state.status = "idle";
      state.windowId = null;
      state.lastSubmitted = "";
      if (options.notify !== false) {
        notifyBackground(false, options.extra);
      }
      return { ok: true, alreadyStopped: true };
    }

    state.shouldAutoRestart = false;
    state.status = "stopping";
    recognition.stop();

    if (options.notify !== false) {
      notifyBackground(false, options.extra);
    }

    return { ok: true };
  };

  const startRecognition = ({ windowId, language }) => {
    if (!SpeechRecognition) {
      const error = "Speech recognition is not supported in this browser.";
      notifyBackground(false, { error });
      return { ok: false, error };
    }

    if (state.recognition) {
      if (language && language !== state.lang) {
        state.lang = language;
        state.recognition.lang = language;
      }
      state.shouldAutoRestart = true;
      state.status = "running";
      notifyBackground(true);
      return { ok: true, alreadyRunning: true };
    }

    const recognition = new SpeechRecognition();
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.lang = language || state.lang;

    recognition.addEventListener("result", handleResult);
    recognition.addEventListener("error", handleError);
    recognition.addEventListener("end", handleEnd);
    recognition.addEventListener("start", () => {
      state.status = "running";
    });

    state.recognition = recognition;
    state.windowId = windowId;
    state.lang = recognition.lang;
    state.shouldAutoRestart = true;
    state.status = "starting";
    state.lastSubmitted = "";

    try {
      recognition.start();
      notifyBackground(true);
      return { ok: true };
    } catch (error) {
      log(error, "error");
      state.recognition = null;
      state.shouldAutoRestart = false;
      state.status = "idle";
      state.windowId = null;
      state.lastSubmitted = "";
      const message = error && error.message ? error.message : "Failed to start recognition.";
      notifyBackground(false, { error: message });
      return { ok: false, error: message };
    }
  };

  const updateLanguage = (language) => {
    if (!language) {
      return { ok: true };
    }

    state.lang = language;
    notifyBackground(Boolean(state.recognition));

    if (!state.recognition) {
      return { ok: true };
    }

    state.recognition.lang = language;
    state.shouldAutoRestart = true;
    state.recognition.stop();
    return { ok: true };
  };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.scope !== "dartsvoice") {
      return;
    }

    switch (message.type) {
      case "ping": {
        sendResponse({
          ok: true,
          supported: Boolean(SpeechRecognition),
          status: state.status,
        });
        break;
      }
      case "start": {
        const response = startRecognition({
          windowId: message.windowId,
          language: message.language,
        });
        sendResponse(response);
        break;
      }
      case "stop": {
        const response = stopRecognition({ notify: message.notify !== false });
        sendResponse(response);
        break;
      }
      case "language:update": {
        const response = updateLanguage(message.language);
        sendResponse(response);
        break;
      }
      default:
        sendResponse({ ok: false, error: "unknown-command" });
    }
    return true;
  });
})();
