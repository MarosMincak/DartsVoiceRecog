const DEFAULT_WINDOW_STATE = Object.freeze({
  status: false,
  lang: "sk-SK",
  dialect: "",
  lastError: null,
});

const windowStore = new Map();

function cloneState(state) {
  return {
    status: state.status,
    lang: state.lang,
    dialect: state.dialect,
    lastError: state.lastError,
  };
}

function ensureWindowState(windowId) {
  if (!windowStore.has(windowId)) {
    windowStore.set(windowId, { ...DEFAULT_WINDOW_STATE });
  }
  return windowStore.get(windowId);
}

function readWindowState(windowId) {
  const state = ensureWindowState(windowId);
  return cloneState(state);
}

function updateWindowState(windowId, patch = {}) {
  const state = ensureWindowState(windowId);
  Object.assign(state, patch);
  return cloneState(state);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.scope !== "dartsvoice") {
    return;
  }

  if (typeof message.windowId === "undefined" && message.type !== "window:clear") {
    sendResponse({ ok: false, error: "windowId-missing" });
    return;
  }

  const windowId = typeof message.windowId === "undefined" ? undefined : String(message.windowId);

  switch (message.type) {
    case "window:get": {
      const data = readWindowState(windowId);
      sendResponse({ ok: true, data });
      break;
    }
    case "window:update": {
      const patch = message.patch || {};
      const data = updateWindowState(windowId, patch);
      sendResponse({ ok: true, data });
      break;
    }
    case "window:clear": {
      if (typeof windowId === "undefined") {
        windowStore.clear();
      } else {
        windowStore.delete(windowId);
      }
      sendResponse({ ok: true });
      break;
    }
    default:
      sendResponse({ ok: false, error: "unknown-command" });
  }
});
