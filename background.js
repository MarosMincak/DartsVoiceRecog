const DEFAULT_WINDOW_STATE = Object.freeze({
  status: false,
  lang: "en-GB",
  dialect: "",
  lastError: null,
});

const storeKey = (windowId) => `dartsvoice:window:${windowId}`;

async function readWindowState(windowId) {
  const key = storeKey(windowId);
  const stored = await chrome.storage.local.get(key);
  const state = stored[key];
  if (!state) {
    return { ...DEFAULT_WINDOW_STATE };
  }
  return {
    ...DEFAULT_WINDOW_STATE,
    ...state,
  };
}

async function updateWindowState(windowId, patch = {}) {
  const current = await readWindowState(windowId);
  const next = { ...current, ...patch };
  await chrome.storage.local.set({ [storeKey(windowId)]: next });
  return next;
}

async function clearWindowState(windowId) {
  if (typeof windowId === "undefined") {
    const all = await chrome.storage.local.get(null);
    const removals = Object.keys(all).filter((key) => key.startsWith("dartsvoice:window:"));
    if (removals.length) {
      await chrome.storage.local.remove(removals);
    }
    return;
  }
  await chrome.storage.local.remove(storeKey(windowId));
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

  (async () => {
    switch (message.type) {
      case "window:get": {
        const data = await readWindowState(windowId);
        sendResponse({ ok: true, data });
        break;
      }
      case "window:update": {
        const patch = message.patch || {};
        const data = await updateWindowState(windowId, patch);
        sendResponse({ ok: true, data });
        break;
      }
      case "window:clear": {
        await clearWindowState(windowId);
        sendResponse({ ok: true });
        break;
      }
      default:
        sendResponse({ ok: false, error: "unknown-command" });
    }
  })().catch((error) => {
    const messageText = error && error.message ? error.message : "storage-error";
    sendResponse({ ok: false, error: messageText });
  });

  return true;
});
