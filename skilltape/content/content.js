// Content Script — รับ skill text จาก popup แล้วแทรกลงช่องแชทของหน้า AI

function findChatInput() {
  const selectors = [
    "textarea",
    "[contenteditable=\"true\"]",
    "div[role=\"textbox\"]",
  ];

  for (const selector of selectors) {
    const candidates = document.querySelectorAll(selector);
    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0;
      const disabled = el.disabled || el.getAttribute("aria-disabled") === "true";
      if (visible && !disabled) {
        return el;
      }
    }
  }
  return null;
}

function insertIntoTextarea(el, text) {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value"
  ).set;
  nativeSetter.call(el, text);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function insertIntoContentEditable(el, text) {
  el.focus();

  // เลือกเนื้อหาเดิมทั้งหมดก่อนแทรก เพื่อให้ execCommand แทนที่แทนการต่อท้าย
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(el);
  selection.removeAllRanges();
  selection.addRange(range);

  const inserted = document.execCommand("insertText", false, text);
  if (!inserted) {
    // fallback กรณี execCommand ใช้ไม่ได้ (บาง browser/บาง build)
    el.textContent = text;
  }
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function insertSkillText(text) {
  const el = findChatInput();
  if (!el) {
    return { success: false };
  }

  try {
    if (el.tagName === "TEXTAREA") {
      insertIntoTextarea(el, text);
    } else {
      insertIntoContentEditable(el, text);
    }
    el.focus();
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "INSERT_SKILL") {
    const result = insertSkillText(message.text || "");
    sendResponse(result);
  }
  return true; // เผื่อ sendResponse ถูกเรียกแบบ async ในอนาคต
});
