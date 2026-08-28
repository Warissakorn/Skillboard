# Skilltape 🎧

> your mixtape of prompts

Chrome Extension (Manifest V3) สำหรับจัดเก็บและใช้งาน Skill/Prompt ของคุณ
ร่วมกับ ChatGPT และ Claude ได้อย่างรวดเร็ว

## สถานะโปรเจกต์

กำลังพัฒนาแบบแบ่ง Phase — ปัจจุบันอยู่ที่ **Phase 3: Content Script (แทรก skill ลงหน้าแชท AI)**

## โครงสร้างโปรเจกต์

```
skilltape/
├── manifest.json
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/
│   └── content.js
├── utils/
│   └── storage.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## วิธีติดตั้ง (โหมดนักพัฒนา)

1. เปิด `chrome://extensions`
2. เปิดสวิตช์ "Developer mode" (มุมขวาบน)
3. คลิก "Load unpacked" แล้วเลือกโฟลเดอร์ `skilltape/`
4. ไอคอน Skilltape จะปรากฏบน toolbar

## เว็บไซต์ที่รองรับ

- chat.openai.com
- chatgpt.com
- claude.ai

## Storage Layer (`utils/storage.js`)

wrapper สำหรับ `chrome.storage.local` เปิดใช้เป็น global object `window.SkilltapeStorage`:

- `getSkills()` — ดึง skill ทั้งหมด
- `saveSkill(skill)` — สร้างใหม่ (ไม่มี id) หรืออัปเดต (มี id เดิม)
- `updateSkill(id, patch)` — อัปเดตบางฟิลด์ตาม id
- `deleteSkill(id)` — ลบตาม id
- `exportJSON()` / `importJSON(jsonString)` — สำรอง/นำเข้าข้อมูล (validate schema ก่อนเสมอ)

### วิธีทดสอบ

1. Load unpacked แล้วเปิด popup → คลิกขวา → Inspect เพื่อเปิด DevTools ของ popup
2. ใน Console พิมพ์ import สคริปต์ทดสอบ หรือ copy โค้ดจาก
   `utils/storage.test.js` ไปวางใน Console
3. เรียก `runStorageTests()` แล้วดูผลสรุปผ่าน/ไม่ผ่านของแต่ละเคส

## หน้า Popup (Phase 2)

ฟีเจอร์ที่ใช้งานได้แล้ว:

- เพิ่ม skill ผ่านฟอร์ม (ชื่อ, เนื้อหา, หมวดหมู่) พร้อม validation ภาษาไทย
- แสดงรายการ skill เรียงจากอัปเดตล่าสุดไปเก่าสุด
- คัดลอกเนื้อหา skill ไปยัง clipboard (ปุ่ม 📋) พร้อม toast แจ้งเตือน
- ลบ skill (ปุ่ม 🗑️) พร้อม confirm ก่อนลบ
- Empty state เมื่อยังไม่มี skill ("ยังไม่มี skill ในเทปของคุณ 🎵")

- ปุ่ม 🚀 Use — ส่งเนื้อหา skill ไปแทรกในช่องแชทของแท็บที่เปิดอยู่ (ChatGPT/Claude)

ยังไม่เปิดใช้งาน (รอ Phase ถัดไป): ค้นหา (Phase 4), แก้ไข skill (Phase 4),
Export/Import (Phase 5)

## Content Script (Phase 3)

`content/content.js` ถูกฉีดเข้าเฉพาะหน้า chat.openai.com, chatgpt.com,
และ claude.ai (ตาม `content_scripts.matches` ใน manifest.json) รอรับ
message `{ type: "INSERT_SKILL", text }` จาก popup แล้ว:

1. หาช่องแชทด้วย selector เรียงลำดับ: `textarea` → `[contenteditable="true"]`
   → `div[role="textbox"]` (เลือกตัวแรกที่มองเห็นได้และไม่ disabled)
2. ถ้าเป็น `<textarea>` — set ค่าผ่าน native setter แล้ว dispatch `input` event
   (จำเป็นสำหรับ React-controlled input อย่าง ChatGPT)
3. ถ้าเป็น contenteditable — เลือกเนื้อหาเดิมทั้งหมดแล้วใช้
   `document.execCommand("insertText")` แทนที่ (มี fallback เป็น `textContent`)
4. ถ้าหาช่องแชทไม่เจอ → ตอบกลับ `{ success: false }` และ popup จะแสดง toast
   เตือนให้เปิดหน้า AI ก่อน

### วิธีทดสอบ

1. Load unpacked แล้วเปิดแท็บ ChatGPT หรือ Claude.ai ในหน้าต่างเดียวกัน
2. เปิด popup Skilltape → กด 🚀 บน skill ใดก็ได้
3. ข้อความควรไปปรากฏในช่องแชททันที พร้อม toast "แทรกแล้ว! กด Enter เพื่อส่ง"
4. ลองกด 🚀 บนแท็บเว็บอื่น (ที่ไม่ใช่ 3 เว็บข้างต้น) → ควรเห็น toast
   "เปิดหน้า AI ก่อนนะ" โดยไม่ crash
