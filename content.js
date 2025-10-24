const DEBUG = false;
const MAX_SCORE = 180;

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

  const EN_ONES = {
    zero: 0,
    oh: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
  };

  const EN_TEENS = {
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
  };

  const EN_TENS = {
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
  };

  const SK_ONES = {
    nula: 0,
    jedna: 1,
    jeden: 1,
    jedno: 1,
    dve: 2,
    dva: 2,
    tri: 3,
    styri: 4,
    pat: 5,
    sest: 6,
    sedem: 7,
    osem: 8,
    devat: 9,
  };

  const SK_TEENS = {
    desat: 10,
    jedenast: 11,
    dvanast: 12,
    trinast: 13,
    strnast: 14,
    patnast: 15,
    sestnast: 16,
    sedemnast: 17,
    osemnast: 18,
    devatnast: 19,
  };

  const SK_TENS = {
    dvadsat: 20,
    tridsat: 30,
    styridsat: 40,
    patdesiat: 50,
    sestdesiat: 60,
    sedemdesiat: 70,
    osemdesiat: 80,
    devatdesiat: 90,
  };

  const BULL_WORDS = new Set(["bull", "bulls", "bullseye", "bullseyes"]);

  const stripDiacritics = (input) => {
    const value = String(input || "");
    if (typeof value.normalize === "function") {
      return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    return value;
  };

  const tokenizeSpeech = (text) =>
    stripDiacritics(text)
      .toLowerCase()
      .replace(/[^a-z\s-]/g, " ")
      .split(/[\s-]+/)
      .filter(Boolean);

  const parseEnglishTokens = (tokens) => {
    if (!tokens.length) {
      return null;
    }

    let current = 0;
    let matched = false;
    let sawHundred = false;
    const leadingTerm = tokens[0];

    tokens.forEach((word) => {
      if (word === "and" || word === "a") {
        return;
      }

      if (EN_ONES[word] !== undefined) {
        current += EN_ONES[word];
        matched = true;
        return;
      }

      if (EN_TEENS[word] !== undefined) {
        current += EN_TEENS[word];
        matched = true;
        return;
      }

      if (EN_TENS[word] !== undefined) {
        current += EN_TENS[word];
        matched = true;
        return;
      }

      if (word === "hundred") {
        matched = true;
        sawHundred = true;
        if (current === 0) {
          current = 100;
        } else {
          current *= 100;
        }
        return;
      }

      if (BULL_WORDS.has(word)) {
        current += 50;
        matched = true;
      }
    });

    if (!matched) {
      return null;
    }

    if (!sawHundred && leadingTerm === "one" && current >= 20) {
      current += 100;
    }

    if (!sawHundred && leadingTerm === "hundred" && current < 100) {
      current += 100;
    }

    if (!sawHundred && leadingTerm === "one" && current === 0) {
      return 1;
    }

    return current;
  };

  const parseSlovakTokens = (tokens) => {
    if (!tokens.length) {
      return null;
    }

    let current = 0;
    let matched = false;

    tokens.forEach((word) => {
      if (word === "a") {
        return;
      }

      if (SK_ONES[word] !== undefined) {
        current += SK_ONES[word];
        matched = true;
        return;
      }

      if (SK_TEENS[word] !== undefined) {
        current += SK_TEENS[word];
        matched = true;
        return;
      }

      if (SK_TENS[word] !== undefined) {
        current += SK_TENS[word];
        matched = true;
        return;
      }

      if (word === "sto") {
        matched = true;
        if (current === 0) {
          current = 100;
        } else if (current < 100) {
          current += 100;
        }
      }
    });

    if (!matched) {
      return null;
    }

    return current;
  };

  const parseNumberFromWords = (text) => {
    const tokens = tokenizeSpeech(text);
    if (!tokens.length) {
      return null;
    }

    const english = parseEnglishTokens(tokens);
    if (typeof english === "number" && !Number.isNaN(english)) {
      return english;
    }

    const slovak = parseSlovakTokens(tokens);
    if (typeof slovak === "number" && !Number.isNaN(slovak)) {
      return slovak;
    }

    return null;
  };

  const clampScore = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return "";
    }
    if (value < 0) {
      return "0";
    }
    if (value > MAX_SCORE) {
      return String(MAX_SCORE);
    }
    return String(value);
  };

  const extractScoreFromText = (text) => {
    if (!text) {
      return "";
    }

    const digitMatch = text.match(/\d+/g);
    if (digitMatch && digitMatch.length) {
      const candidate = parseInt(digitMatch[digitMatch.length - 1], 10);
      if (!Number.isNaN(candidate)) {
        return clampScore(candidate);
      }
    }

    const spokenValue = parseNumberFromWords(text);
    if (typeof spokenValue === "number") {
      return clampScore(spokenValue);
    }

    return "";
  };

  const selectScoreFromCandidates = (candidates) => {
    if (!candidates || !candidates.length) {
      return "";
    }
    for (let i = 0; i < candidates.length; i += 1) {
      const value = extractScoreFromText(candidates[i]);
      if (value) {
        return value;
      }
    }
    return "";
  };

  const state = {
    recognition: null,
    shouldAutoRestart: false,
    windowId: null,
    lang: "en-GB",
    status: "idle",
    lastSubmitted: "",
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
    const interimCandidates = [];
    const finalCandidates = [];

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const transcripts = Array.from(result).map((alternative) => alternative.transcript || "");
      if (result.isFinal) {
        finalCandidates.push(...transcripts);
      } else {
        interimCandidates.push(...transcripts);
      }
    }

    const interimScore = selectScoreFromCandidates(interimCandidates);
    const finalScore = selectScoreFromCandidates(finalCandidates);

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
    recognition.maxAlternatives = 5;

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
