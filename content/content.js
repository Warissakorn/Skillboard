// Content Script — รับ skill text จาก popup แล้วแทรกลงช่องแชทของหน้า AI
// รันบนทุกเว็บไซต์ (ดู manifest.json) จึงต้องเดาช่องพิมพ์ข้อความแบบทั่วไป
// ไม่อิงโครงสร้าง DOM ของเว็บใดเว็บหนึ่งโดยเฉพาะ

const CHAT_INPUT_SELECTOR = 'textarea, [contenteditable="true"], div[role="textbox"]';

function isUsableInput(el) {
  if (!el || !el.matches || !el.matches(CHAT_INPUT_SELECTOR)) return false;
  const rect = el.getBoundingClientRect();
  const visible = rect.width > 0 && rect.height > 0;
  const disabled = el.disabled || el.getAttribute("aria-disabled") === "true";
  return visible && !disabled;
}

function findChatInput() {
  // ให้ความสำคัญกับช่องที่ผู้ใช้กำลังโฟกัสอยู่ก่อน (แม่นยำที่สุดเพราะเป็นสิ่งที่
  // ผู้ใช้เพิ่งคลิกเอง) แล้วค่อย fallback ไปหาช่องที่ใหญ่ที่สุดบนหน้าเว็บ
  // (ช่องแชทหลักมักมีขนาดใหญ่กว่าช่องค้นหา/คอมเมนต์เล็กๆ อื่นบนหน้า)
  const active = document.activeElement;
  if (isUsableInput(active)) {
    return active;
  }

  const candidates = Array.from(document.querySelectorAll(CHAT_INPUT_SELECTOR)).filter(
    isUsableInput
  );
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const areaA = a.getBoundingClientRect().width * a.getBoundingClientRect().height;
    const areaB = b.getBoundingClientRect().width * b.getBoundingClientRect().height;
    return areaB - areaA;
  });
  return candidates[0];
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
