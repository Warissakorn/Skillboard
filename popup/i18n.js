// UI translations only: saved prompts are never rewritten.
const translations = {
  "ดัดแปลงสำหรับใช้ในแชท": "Adapted for chat",
  "แก้ไข Skill": "Edit skill",
  "อัปเดต Skill": "Update skill",
  "บันทึก Skill": "Save skill",
  "เพิ่ม Skill": "Add skill",
  "＋ เพิ่ม Skill": "+ Add skill",
  "ใช้ใน AI": "Use in AI",
  "ใช้ Prompt ↗": "Use prompt ↗",
  "แก้ไข": "Edit",
  "คัดลอก": "Copy",
  "ลบ": "Delete",
  "อ่านเนื้อหาเต็ม": "Read full prompt",
  "อ่านเนื้อหาเต็ม: {name}": "Read full prompt: {name}",
  "พบ {count} skills": "{count} skills found",
  "{count} Skills พร้อมใช้งาน": "{count} skills ready",
  "ต้องการลบ \"{name}\" ใช่หรือไม่?": "Delete \"{name}\"?",
  "ไม่พบแท็บต้นทาง เปิดหน้าต่างย่อใหม่จากหน้าแชทที่ต้องการ": "Source tab unavailable. Reopen this window from your chat.",
  "ไม่พบช่องพิมพ์ข้อความในหน้านี้ ลองเปิดหน้าแชท AI ก่อนนะ": "No message field found. Open an AI chat first.",
  "แทรกแล้ว! กด Enter เพื่อส่ง": "Inserted! Press Enter to send.",
  "คัดลอกแล้ว": "Copied",
  "คัดลอกไม่สำเร็จ": "Could not copy",
  "ลบแล้ว": "Deleted",
  "กรุณาระบุชื่อ skill": "Enter a skill name",
  "กรุณาระบุเนื้อหา skill": "Enter skill content",
  "กำลังบันทึก…": "Saving…",
  "อัปเดตแล้ว": "Updated",
  "บันทึกแล้ว": "Saved",
  "บันทึกไม่สำเร็จ": "Could not save",
  "Export สำเร็จ": "Export complete",
  "Export ไม่สำเร็จ": "Export failed",
  "Import สำเร็จ": "Import complete",
  "Import ไม่สำเร็จ": "Import failed",
  "แทนที่ Skills เดิมทั้งหมด? แนะนำให้ Export สำรองข้อมูลก่อน": "Replace all existing skills? Export a backup first.",
  "โหลดรายการไม่สำเร็จ ลองเปิดใหม่": "Could not load skills. Please reopen.",
  "โหมดการ์ดเล็ก": "Compact cards",
  "สลับการ์ดเล็กแนวตั้ง เลื่อนแนวนอน": "Toggle compact horizontal cards",
  "เปิดค้างและปรับขนาดได้ ใช้ Prompt กับแท็บที่เลือกในหน้าต่างเดิม": "Open a resizable window; use prompts in the source window",
  "หน้าต่าง ↗": "Window ↗",
  "คลัง Prompt ของคุณ": "Your prompt library",
  "ค้นหาชื่อหรือเนื้อหา Prompt…": "Search names or prompt content…",
  "รายการ Prompt": "Prompt list",
  "ยังไม่มี Skill — กด “＋ เพิ่ม Skill” เพื่อเก็บ Prompt แรกของคุณ": "No skills yet — add a skill or browse starter skills.",
  "ไม่พบ Skill ลองเปลี่ยนคำค้นหรือล้างช่องค้นหา": "No matching skills. Try another search.",
  "ส่งออก JSON": "Export JSON",
  "นำเข้า JSON": "Import JSON",
  "ชื่อ": "Name",
  "เช่น สรุปบทความให้กระชับ": "e.g. Summarize an article",
  "เนื้อหา": "Content",
  "วางเนื้อหา skill/prompt ที่นี่...": "Paste skill/prompt content here…",
  "ยกเลิก": "Cancel",
  "ปิด": "Close",
  "นำเข้า Skills": "Import skills",
  "เลือกวิธีนำเข้าไฟล์ของคุณ การแทนที่จะลบรายการเดิมทั้งหมด": "Choose how to import. Replace removes all existing skills.",
  "รวมกับข้อมูลเดิม": "Merge with existing",
  "แทนที่ทั้งหมด": "Replace all",
  "กลับรายการแนวตั้ง": "Switch to vertical list",
  "การ์ดเล็กแนวตั้ง เลื่อนแนวนอน": "Compact cards, horizontal scrolling",
  "ปรับขนาดหน้าต่างไม่สำเร็จ ลองอีกครั้ง": "Could not resize window. Try again.",
  "เปิดหน้าต่างย่อไม่สำเร็จ ลองอีกครั้ง": "Could not open window. Try again.",
  "ไม่พบหน้าต่างต้นทาง": "Source window unavailable",
  "Skilltape — หน้าต่างย่อ": "Skilltape — Mini window",
  "Skills เริ่มต้น": "Starter skills",
  "เพิ่มเข้าคลัง": "Add to library",
  "เพิ่มแล้ว": "Added",
  "โหลด Skills ไม่สำเร็จ": "Could not load starter skills",
  "ภาษา": "Language",
  "เลือก skill แล้วเพิ่มเข้าคลัง ใช้ได้ทันทีโดยไม่ต้องดาวน์โหลดเพิ่ม": "Choose a skill to add. Bundled prompts work offline.",
  "ไม่พบ id ของ skill ที่ต้องการอัปเดต": "Missing skill ID",
  "ไม่พบ skill ที่ต้องการอัปเดต": "Skill not found",
  "ไฟล์ที่นำเข้าไม่ถูกต้อง: ไม่พบรายการ skills": "Invalid import: missing skills array",
  "ไฟล์ที่นำเข้าไม่ถูกต้อง: โครงสร้างข้อมูล skill ไม่ครบถ้วน": "Invalid import: incomplete skill data",
  "ไฟล์ที่นำเข้าไม่ใช่ JSON ที่ถูกต้อง": "The import file is not valid JSON"
};
let locale = (navigator.language || 'en').startsWith('th') ? 'th' : 'en';
function t(key, values = {}) {
  if (typeof key !== 'string') return '';
  const text = locale === 'en' ? (translations[key] || key) : key;
  return text.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
}
function applyLanguage() {
  document.documentElement.lang = locale;
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const attr of ['title', 'placeholder', 'aria-label']) {
    for (const el of document.querySelectorAll('[data-i18n-' + attr + ']')) el.setAttribute(attr, t(el.getAttribute('data-i18n-' + attr)));
  }
  document.getElementById('languageSelect').value = locale;
  document.dispatchEvent(new Event('languagechange'));
}
const languageReady = chrome.storage.local.get('language').then(data => {
  if (['th', 'en'].includes(data.language)) locale = data.language;
  applyLanguage();
}).catch(() => applyLanguage());
document.getElementById('languageSelect').addEventListener('change', async event => {
  const next = event.target.value;
  try { await chrome.storage.local.set({language: next}); locale = next; applyLanguage(); }
  catch { event.target.value = locale; showToast(t('บันทึกไม่สำเร็จ')); }
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.language && ['th','en'].includes(changes.language.newValue)) {
    locale = changes.language.newValue; applyLanguage();
  }
});
