// Detached window keeps its source browser window as the explicit insertion target.
(() => {
  const params = new URLSearchParams(window.location.search);
  const isMini = params.get("mode") === "mini";
  const source = params.get("sourceWindow");
  const sourceWindowId = source !== null && /^\d+$/.test(source) ? Number(source) : null;
  let cardMode = params.get("layout") === "cards";
  let resizing = false;
  let previousSize = null;
  const cardButton = document.getElementById("cardModeBtn");
  const button = document.getElementById("miniWindowBtn");
  if (isMini) {
    document.body.classList.add("mini-window");
    button.hidden = true;
    document.title = "Skilltape — หน้าต่างย่อ";
  }

  function applyCardMode() {
    document.body.classList.toggle("card-mode", cardMode);
    cardButton.setAttribute("aria-pressed", String(cardMode));
    cardButton.title = cardMode ? "กลับรายการแนวตั้ง" : "การ์ดเล็กแนวตั้ง เลื่อนแนวนอน";
    cardButton.textContent = cardMode ? "☰" : "▥";
  }
  applyCardMode();

  async function toggleCardMode() {
    if (resizing) return;
    resizing = true;
    cardButton.disabled = true;
    try {
      if (isMini) {
        const current = await chrome.windows.getCurrent();
        const size = cardMode ? (previousSize || {width: 360, height: 480}) : {height: 420};
        await chrome.windows.update(current.id, size);
        if (!cardMode) previousSize = {width: current.width, height: current.height};
      }
      cardMode = !cardMode;
      applyCardMode();
    } catch (error) {
      showToast("ปรับขนาดหน้าต่างไม่สำเร็จ ลองอีกครั้ง");
    } finally {
      resizing = false;
      cardButton.disabled = false;
    }
  }
  cardButton.addEventListener("click", toggleCardMode);

  let opening = false;
  async function openMiniWindow() {
    if (opening) return;
    opening = true;
    button.disabled = true;
    try {
      const sourceWindow = await chrome.windows.getCurrent();
      const url = new URL(chrome.runtime.getURL("popup/popup.html"));
      url.searchParams.set("mode", "mini");
      if (cardMode) url.searchParams.set("layout", "cards");
      url.searchParams.set("sourceWindow", String(sourceWindow.id));
      await chrome.windows.create({url: url.href, type: "popup", width: 360, height: cardMode ? 420 : 480});
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
    toggleCardMode,
  };
  button.addEventListener("click", openMiniWindow);
})();
