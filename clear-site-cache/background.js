// Clear Site Data
// 左键点图标：清空 + 重新加载
// 右键：清空缓存 / 清空缓存并重新加载
// 清空范围：Cookie / LocalStorage / IndexedDB / CacheStorage / Service Worker / FileSystem / WebSQL / sessionStorage

const SITE_DATA = {
  cookies: true,
  localStorage: true,
  indexedDB: true,
  cacheStorage: true,
  serviceWorkers: true,
  fileSystems: true,
  webSQL: true
};

// 右键菜单：就两条
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: "clear",        title: "清空缓存",           contexts: ["page"] });
    chrome.contextMenus.create({ id: "clear-reload", title: "清空缓存并重新加载", contexts: ["page"] });
  });
});

// 左键 = 清空 + 重新加载
chrome.action.onClicked.addListener((tab) => clearSite(tab, true));

// 右键
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "clear") return clearSite(tab, false);
  if (info.menuItemId === "clear-reload") return clearSite(tab, true);
});

async function clearSite(tab, reload) {
  const url = (tab && tab.url) || "";
  if (!/^https?:\/\//i.test(url)) {
    flash("n/a", "#888888");
    return;
  }
  const origin = new URL(url).origin;

  try {
    await chrome.browsingData.remove({ origins: [origin] }, SITE_DATA);
  } catch (e) {
    console.error("[Clear Site Data] failed:", e);
    flash("!", "#c62828");
    return;
  }

  // sessionStorage 不在 browsingData 范围内，注入清一下
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: () => { try { sessionStorage.clear(); } catch (_) {} }
    });
  } catch (e) {
    // 某些页面不允许注入（chrome:// 等），忽略
  }

  flash("\u2713", "#2e7d32");
  if (reload) chrome.tabs.reload(tab.id, { bypassCache: true });
}

function flash(text, color) {
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 1200);
}
