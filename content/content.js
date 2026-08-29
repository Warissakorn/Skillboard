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
  // แทรกที่ตำแหน่งเคอร์เซอร์แทนการล้างข้อความเดิมทิ้ง — เชื่อ selectionStart/End
  // ก็ต่อเมื่อช่องนี้เป็นช่องที่ผู้ใช้โฟกัสอยู่จริงก่อนกด Use เท่านั้น (เช็คก่อน
  // เรียก focus() ใดๆ เพราะการ focus เองอาจไปรีเซ็ตตำแหน่งเคอร์เซอร์) ถ้าไม่ได้
  // โฟกัสอยู่ (เช่น เพิ่งเลือกช่องนี้มาแบบ fallback) ให้ต่อท้ายข้อความเดิมเสมอ
  const wasFocused = document.activeElement === el;
  const start = wasFocused && typeof el.selectionStart === "number" ? el.selectionStart : el.value.length;
  const end = wasFocused && typeof el.selectionEnd === "number" ? el.selectionEnd : el.value.length;

  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value"
  ).set;
  const newValue = el.value.slice(0, start) + text + el.value.slice(end);
  nativeSetter.call(el, newValue);

  const cursorPos = start + text.length;
  el.selectionStart = el.selectionEnd = cursorPos;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function insertIntoContentEditable(el, text) {
  // เก็บตำแหน่งเคอร์เซอร์เดิมไว้ก่อนเรียก focus() เพราะ focus() เองอาจไปรีเซ็ต
  // ตำแหน่ง caret ในบางเบราว์เซอร์/บาง editor framework
  const wasFocused = document.activeElement === el;
  const selection = window.getSelection();
  const savedRange =
    wasFocused && selection.rangeCount > 0 && el.contains(selection.getRangeAt(0).commonAncestorContainer)
      ? selection.getRangeAt(0).cloneRange()
      : null;

  el.focus();

  if (savedRange) {
    selection.removeAllRanges();
    selection.addRange(savedRange);
  } else {
    // ไม่ได้โฟกัสช่องนี้อยู่ก่อน (เช่น เพิ่งเลือกช่องนี้มาแบบ fallback) —
    // ต่อท้ายข้อความเดิมเสมอ ไม่ใช่ล้างทิ้งแล้วแทนที่
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false); // collapse ไปที่ท้ายเนื้อหาเดิม
    selection.removeAllRanges();
    selection.addRange(range);
  }

  const inserted = document.execCommand("insertText", false, text);
  if (!inserted) {
    // fallback กรณี execCommand ใช้ไม่ได้ (บาง browser/บาง build) — ต่อท้ายเนื้อหาเดิม
    el.appendChild(document.createTextNode(text));
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
