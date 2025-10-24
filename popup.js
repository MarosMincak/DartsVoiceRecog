const RAW_LANGUAGES = [
  ["Afrikaans", ["af-ZA"]],
  ["Bahasa Indonesia", ["id-ID"]],
  ["Bahasa Melayu", ["ms-MY"]],
  ["Catalan", ["ca-ES"]],
  ["Czech", ["cs-CZ"]],
  ["German", ["de-DE"]],
  [
    "English",
    ["en-AU", "Australia"],
    ["en-CA", "Canada"],
    ["en-IN", "India"],
    ["en-NZ", "New Zealand"],
    ["en-ZA", "South Africa"],
    ["en-GB", "United Kingdom"],
    ["en-US", "United States"],
  ],
  [
    "Spanish",
    ["es-AR", "Argentina"],
    ["es-BO", "Bolivia"],
    ["es-CL", "Chile"],
    ["es-CO", "Colombia"],
    ["es-CR", "Costa Rica"],
    ["es-EC", "Ecuador"],
    ["es-SV", "El Salvador"],
    ["es-ES", "España"],
    ["es-US", "Estados Unidos"],
    ["es-GT", "Guatemala"],
    ["es-HN", "Honduras"],
    ["es-MX", "México"],
    ["es-NI", "Nicaragua"],
    ["es-PA", "Panamá"],
    ["es-PY", "Paraguay"],
    ["es-PE", "Perú"],
    ["es-PR", "Puerto Rico"],
    ["es-DO", "República Dominicana"],
    ["es-UY", "Uruguay"],
    ["es-VE", "Venezuela"],
  ],
  ["Basque", ["eu-ES"]],
  ["French", ["fr-FR"]],
  ["Galician", ["gl-ES"]],
  ["Croatian", ["hr_HR"]],
  ["Zulu", ["zu-ZA"]],
  ["Icelandic", ["is-IS"]],
  [
    "Italian",
    ["it-IT", "Italia"],
    ["it-CH", "Svizzera"],
  ],
  ["Hungarian", ["hu-HU"]],
  ["Dutch", ["nl-NL"]],
  ["Norwegian Bokmål", ["nb-NO"]],
  ["Polish", ["pl-PL"]],
  [
    "Portuguese",
    ["pt-BR", "Brasil"],
    ["pt-PT", "Portugal"],
  ],
  ["Romanian", ["ro-RO"]],
  ["Slovak", ["sk-SK"]],
  ["Finnish", ["fi-FI"]],
  ["Swedish", ["sv-SE"]],
  ["Turkish", ["tr-TR"]],
  ["Bulgarian", ["bg-BG"]],
  ["Russian", ["ru-RU"]],
  ["Serbian", ["sr-RS"]],
  ["Korean", ["ko-KR"]],
  [
    "Chinese",
    ["cmn-Hans-CN", "普通话 (中国大陆)"],
    ["cmn-Hans-HK", "普通话 (香港)"],
    ["cmn-Hant-TW", "中文 (台灣)"],
    ["yue-Hant-HK", "粵語 (香港)"],
  ],
  ["Japanese", ["ja-JP"]],
  ["Latin", ["la"]],
];

const DEFAULT_DIALECT = "en-GB";

const LANGUAGES = RAW_LANGUAGES.map(([label, ...codes]) => ({
  label,
  dialects: codes.map(([code, dialectLabel]) => ({
    code,
    label: dialectLabel || LangString("texts.def"),
  })),
}));

const DIALECT_TO_LANGUAGE = new Map();
LANGUAGES.forEach((language, index) => {
  language.dialects.forEach((dialect) => {
    DIALECT_TO_LANGUAGE.set(dialect.code, index);
  });
});

const DEFAULT_LANGUAGE_INDEX = DIALECT_TO_LANGUAGE.get(DEFAULT_DIALECT) ?? 0;

const state = {
  tabId: null,
  url: "",
  blocked: false,
  listening: false,
  toggling: false,
  selectedLanguageIndex: DEFAULT_LANGUAGE_INDEX,
  selectedDialect: DEFAULT_DIALECT,
  lastError: null,
};

const dom = {};

const runtimeSend = (message) =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response || { ok: true });
    });
  });

const tabsSend = (tabId, message) =>
  new Promise((resolve) => {
    if (!tabId) {
      resolve({ ok: false, error: "missing-tab" });
      return;
    }
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response || { ok: true });
    });
  });

const getActiveTab = () =>
  new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError || !tabs || !tabs.length) {
        resolve(null);
        return;
      }
      resolve(tabs[0]);
    });
  });

const isSupportedUrl = (url) => /^https?:\/\/n01darts\.com\/n01\/web\//i.test(url || "");

function cacheDom() {
  dom.toggle = document.getElementById("mainswitch");
  dom.toggleLabel = document.getElementById("toggle-label");
  dom.warnbox = document.getElementById("warnbox");
  dom.warnboxMsg = document.getElementById("warnbox-msg");
  dom.appSelect = document.getElementById("select_darts_application");
  dom.languageSelect = document.getElementById("select_language");
  dom.dialectSelect = document.getElementById("select_dialect");
  dom.statusText = document.getElementById("status-text");

  if (dom.appSelect) {
    dom.appSelect.value = "nakka";
  }
}

function setAlert(message, tone = "info") {
  if (!dom.warnbox || !dom.warnboxMsg) {
    return;
  }

  dom.warnbox.className = "alert";

  if (!message) {
    dom.warnbox.classList.add("alert--hidden");
    dom.warnboxMsg.textContent = "";
    return;
  }

  dom.warnboxMsg.textContent = message;

  switch (tone) {
    case "error":
      dom.warnbox.classList.add("alert--error");
      break;
    case "warn":
      dom.warnbox.classList.add("alert--warn");
      break;
    case "success":
      dom.warnbox.classList.add("alert--success");
      break;
    default:
      dom.warnbox.classList.add("alert--info");
  }
}

function clearAlert() {
  setAlert("");
}

function setStatusText(message) {
  if (!dom.statusText) {
    return;
  }
  dom.statusText.textContent = message || "";
}

function setToggleDisabled(disabled) {
  if (!dom.toggle) {
    return;
  }
  dom.toggle.disabled = disabled;
  dom.toggle.classList.toggle("listen-toggle--disabled", disabled);
  dom.toggle.setAttribute("aria-disabled", disabled ? "true" : "false");
}

function updateToggleUI() {
  if (!dom.toggle || !dom.toggleLabel) {
    return;
  }

  dom.toggle.setAttribute("aria-checked", state.listening ? "true" : "false");
  dom.toggle.classList.toggle("listen-toggle--active", state.listening);
  dom.toggleLabel.textContent = state.listening ? LangString("toggle.on") : LangString("toggle.off");
}

function renderLanguageOptions() {
  if (!dom.languageSelect) {
    return;
  }

  dom.languageSelect.innerHTML = "";
  LANGUAGES.forEach((language, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = language.label;
    dom.languageSelect.appendChild(option);
  });
  dom.languageSelect.value = String(state.selectedLanguageIndex);
}

function renderDialectOptions(languageIndex, preferredCode) {
  if (!dom.dialectSelect) {
    return DEFAULT_DIALECT;
  }

  dom.dialectSelect.innerHTML = "";
  const language = LANGUAGES[languageIndex];

  if (!language) {
    return DEFAULT_DIALECT;
  }

  language.dialects.forEach((dialect) => {
    const option = document.createElement("option");
    option.value = dialect.code;
    option.textContent = dialect.label;
    dom.dialectSelect.appendChild(option);
  });

  const hasPreferred = language.dialects.some((dialect) => dialect.code === preferredCode);
  const selectedCode = hasPreferred
    ? preferredCode
    : language.dialects[0]?.code || DEFAULT_DIALECT;

  dom.dialectSelect.value = selectedCode;
  state.selectedDialect = selectedCode;
  return selectedCode;
}

async function updateLanguagePreference(code, { propagate } = { propagate: false }) {
  if (!code) {
    return;
  }

  state.selectedDialect = code;

  const result = await runtimeSend({
    scope: "dartsvoice",
    type: "window:update",
    windowId: state.tabId,
    patch: { lang: code, status: state.listening },
  });

  if (!result.ok && result.error) {
    setAlert(result.error, "warn");
  }

  if (!propagate || !state.listening) {
    return;
  }

  const response = await tabsSend(state.tabId, {
    scope: "dartsvoice",
    type: "language:update",
    language: code,
    windowId: state.tabId,
  });

  if (!response.ok) {
    setAlert(LangString("message.language_update_failed"), "warn");
  }
}

async function handleToggle() {
  if (state.blocked || state.toggling) {
    if (state.blocked) {
      setAlert(LangString("message.unsupported_switch"), "error");
    }
    return;
  }

  state.toggling = true;
  setToggleDisabled(true);

  if (state.listening) {
    const response = await tabsSend(state.tabId, {
      scope: "dartsvoice",
      type: "stop",
      windowId: state.tabId,
    });

    if (!response.ok) {
      setAlert(response.error || LangString("message.stop_failed"), "error");
    } else {
      state.listening = false;
      clearAlert();
      setStatusText(LangString("status.ready"));
    }
  } else {
    const response = await tabsSend(state.tabId, {
      scope: "dartsvoice",
      type: "start",
      windowId: state.tabId,
      language: state.selectedDialect,
    });

    if (!response.ok) {
      const errorMessage =
        response.error === "Speech recognition is not supported in this browser."
          ? LangString("message.unsupported_api")
          : response.error || LangString("message.start_failed");
      setAlert(errorMessage, "error");
    } else {
      state.listening = true;
      clearAlert();
      setStatusText(LangString("status.listening"));
    }
  }

  updateToggleUI();
  setToggleDisabled(false);
  state.toggling = false;
}

async function handleLanguageChange(event) {
  const index = Number(event.target.value);
  if (Number.isNaN(index) || !LANGUAGES[index]) {
    return;
  }

  state.selectedLanguageIndex = index;
  const selectedCode = renderDialectOptions(index, state.selectedDialect);
  await updateLanguagePreference(selectedCode, { propagate: true });
}

async function handleDialectChange(event) {
  const code = event.target.value;
  await updateLanguagePreference(code, { propagate: true });
}

function attachListeners() {
  if (dom.toggle) {
    dom.toggle.addEventListener("click", handleToggle);
  }

  if (dom.appSelect) {
    dom.appSelect.addEventListener("change", () => {
      dom.appSelect.value = "nakka";
    });
    dom.appSelect.value = "nakka";
  }

  if (dom.languageSelect) {
    dom.languageSelect.addEventListener("change", handleLanguageChange);
  }

  if (dom.dialectSelect) {
    dom.dialectSelect.addEventListener("change", handleDialectChange);
  }
}

async function ensureContentReady() {
  const response = await tabsSend(state.tabId, { scope: "dartsvoice", type: "ping" });
  if (!response.ok) {
    return { ok: false, error: response.error || "unavailable" };
  }

  if (!response.supported) {
    return {
      ok: false,
      error: "unsupported-api",
    };
  }

  return { ok: true };
}

async function syncWindowState() {
  const result = await runtimeSend({
    scope: "dartsvoice",
    type: "window:get",
    windowId: state.tabId,
  });

  if (!result.ok || !result.data) {
    return;
  }

  const { status, lang, lastError } = result.data;
  state.listening = Boolean(status);
  state.selectedDialect = lang || DEFAULT_DIALECT;
  state.lastError = lastError || null;
}

function applyLocalization() {
  const labelLang = document.getElementById("label_lang");
  const labelDialect = document.getElementById("label_dialect");
  const labelApp = document.getElementById("label_app");
  const tagline = document.getElementById("tagline");

  if (labelLang) {
    labelLang.textContent = LangString("label.lang");
  }
  if (labelDialect) {
    labelDialect.textContent = LangString("label.dialect");
  }
  if (labelApp) {
    labelApp.textContent = LangString("label.app");
  }
  if (tagline) {
    tagline.textContent = LangString("tagline.app");
  }
  if (dom.toggleLabel) {
    dom.toggleLabel.textContent = LangString("toggle.off");
  }
}

async function initialise() {
  cacheDom();
  applyLocalization();
  renderLanguageOptions();
  renderDialectOptions(state.selectedLanguageIndex, state.selectedDialect);
  attachListeners();
  updateToggleUI();
  setStatusText(LangString("status.loading"));

  const activeTab = await getActiveTab();
  if (!activeTab) {
    setAlert(LangString("message.no_active_tab"), "error");
    setToggleDisabled(true);
    setStatusText("");
    return;
  }

  state.tabId = activeTab.id;
  state.url = activeTab.url || "";

  if (!isSupportedUrl(state.url)) {
    state.blocked = true;
    setToggleDisabled(true);
    setAlert(LangString("message.unsupported_website"), "error");
    setStatusText(LangString("status.blocked"));
    return;
  }

  const readiness = await ensureContentReady();
  if (!readiness.ok) {
    setToggleDisabled(true);
    if (readiness.error === "unsupported-api") {
      setAlert(LangString("message.unsupported_api"), "error");
    } else {
      setAlert(LangString("message.reload_required"), "warn");
    }
    setStatusText(LangString("status.ready"));
    return;
  }

  await syncWindowState();

  const languageIndex =
    DIALECT_TO_LANGUAGE.get(state.selectedDialect) ??
    DIALECT_TO_LANGUAGE.get(DEFAULT_DIALECT) ??
    DEFAULT_LANGUAGE_INDEX;

  state.selectedLanguageIndex = languageIndex;

  if (dom.languageSelect) {
    dom.languageSelect.value = String(languageIndex);
  }

  renderDialectOptions(languageIndex, state.selectedDialect);

  updateToggleUI();

  if (state.listening) {
    setStatusText(LangString("status.listening"));
  } else {
    setStatusText(LangString("status.ready"));
  }

  if (state.lastError) {
    setAlert(state.lastError, "warn");
  } else {
    clearAlert();
  }

  setToggleDisabled(false);
}

document.addEventListener("DOMContentLoaded", initialise);
