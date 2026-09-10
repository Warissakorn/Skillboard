// Detached window keeps its source browser window as the explicit insertion target.
(() => {
  const params = new URLSearchParams(window.location.search);
  const isMini = params.get("mode") === "mini";
  const source = params.get("sourceWindow");
  const sourceWindowId = source !== null && /^\d+$/.test(source) ? Number(source) : null;
  let cardMode = isMini || params.get("layout") === "cards";
  const cardButton = document.getElementById("cardModeBtn");
  const button = document.getElementById("miniWindowBtn");
  if (isMini) {
    document.body.classList.add("mini-window");
    button.hidden = true;
    cardButton.hidden = true;
    document.title = t("Skilltape — หน้าต่างย่อ");
  }

  function applyCardMode() {
    document.body.classList.toggle("card-mode", cardMode);
    cardButton.setAttribute("aria-pressed", String(cardMode));
    cardButton.title = cardMode ? t("กลับรายการแนวตั้ง") : t("การ์ดเล็กแนวตั้ง เลื่อนแนวนอน");
    cardButton.textContent = cardMode ? "☰" : "▥";
  }
  applyCardMode();
  document.addEventListener("languagechange", () => { applyCardMode(); if (isMini) document.title = t("Skilltape — หน้าต่างย่อ"); });

  function toggleCardMode() {
    if (isMini) return;
    cardMode = !cardMode;
    applyCardMode();
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
      url.searchParams.set("layout", "cards");
      url.searchParams.set("sourceWindow", String(sourceWindow.id));
      await chrome.windows.create({url: url.href, type: "popup", width: 360, height: 420});
      window.close();
    } catch (error) {
      showToast(t("เปิดหน้าต่างย่อไม่สำเร็จ ลองอีกครั้ง"));
    } finally {
      opening = false;
      button.disabled = false;
    }
  }

  window.SkilltapeWindow = {
    async getTargetTab() {
      if (isMini && sourceWindowId === null) throw new Error(t("ไม่พบหน้าต่างต้นทาง"));
      const query = isMini ? {active: true, windowId: sourceWindowId} : {active: true, currentWindow: true};
      const [tab] = await chrome.tabs.query(query);
      return tab;
    },
    openMiniWindow,
    toggleCardMode,
  };
  button.addEventListener("click", openMiniWindow);
})();
