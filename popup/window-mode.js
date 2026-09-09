// Detached window keeps its source browser window as the explicit insertion target.
(() => {
  const params = new URLSearchParams(window.location.search);
  const isMini = params.get("mode") === "mini";
  const source = params.get("sourceWindow");
  const sourceWindowId = source !== null && /^\d+$/.test(source) ? Number(source) : null;
  const button = document.getElementById("miniWindowBtn");
  if (isMini) {
    document.body.classList.add("mini-window");
    button.hidden = true;
    document.title = "Skilltape — หน้าต่างย่อ";
  }

  let opening = false;
  async function openMiniWindow() {
    if (opening) return;
    opening = true;
    button.disabled = true;
    try {
      const sourceWindow = await chrome.windows.getCurrent();
      const url = new URL(chrome.runtime.getURL("popup/popup.html"));
      url.searchParams.set("mode", "mini");
      url.searchParams.set("sourceWindow", String(sourceWindow.id));
      await chrome.windows.create({url: url.href, type: "popup", width: 360, height: 480});
      window.close();
    } catch (error) {
      showToast("เปิดหน้าต่างย่อไม่สำเร็จ ลองอีกครั้ง");
    } finally {
      opening = false;
      button.disabled = false;
    }
  }

  window.SkilltapeWindow = {
    async getTargetTab() {
      if (isMini && sourceWindowId === null) throw new Error("ไม่พบหน้าต่างต้นทาง");
      const query = isMini ? {active: true, windowId: sourceWindowId} : {active: true, currentWindow: true};
      const [tab] = await chrome.tabs.query(query);
      return tab;
    },
    openMiniWindow,
  };
  button.addEventListener("click", openMiniWindow);
})();
