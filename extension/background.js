/* CLARITAS — fundal minimal: doar scurtături de tastatură (absente pe unele browsere mobile). */
const api = typeof browser !== 'undefined' ? browser : chrome;

if (api.commands && api.commands.onCommand) {
  api.commands.onCommand.addListener(async (cmd) => {
    try {
      const [tab] = await api.tabs.query({ active: true, currentWindow: true });
      if (tab) await api.tabs.sendMessage(tab.id, { type: 'command', cmd }, { frameId: 0 });
    } catch (e) { /* pagină fără content script (ex. pagini interne) */ }
  });
}

/* Captură locală: captureVisibleTab dă o imagine data: care rămâne în browser; nimic nu este trimis nicăieri. */
api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return;
  if (msg.type === 'cap-visible') {
    const wid = sender && sender.tab ? sender.tab.windowId : undefined;
    api.tabs.captureVisibleTab(wid, { format: 'png' }).then((url) => sendResponse({ url }), (e) => sendResponse({ err: String(e && e.message || e) }));
    return true;
  }
  if (msg.type === 'lang') {
    const c = String(msg.code || ''); if (!/^(fr|it|es|pt|de|hu)$/.test(c)) { sendResponse({ dict: null }); return; }
    fetch(api.runtime.getURL('lang/' + c + '.json')).then((r) => r.json()).then((d) => sendResponse({ dict: d }), () => sendResponse({ dict: null }));
    return true;
  }
  if (msg.type === 'cap-mask') {
    if (sender && sender.tab) api.tabs.sendMessage(sender.tab.id, { type: 'cap-mask', on: !!msg.on }).catch(() => { });
    sendResponse({ ok: true }); return;
  }
  if (msg.type === 'rec-open') {
    api.tabs.create({ url: api.runtime.getURL('recorder.html') }).then(() => sendResponse({ ok: true }), () => sendResponse({ ok: false }));
    return true;
  }
});
