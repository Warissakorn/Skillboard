# Skilltape 🎧

> your mixtape of prompts

Chrome Extension (Manifest V3) สำหรับจัดเก็บและใช้งาน Skill/Prompt ของคุณ
ร่วมกับ ChatGPT และ Claude ได้อย่างรวดเร็ว

## สถานะโปรเจกต์

**เสร็จสมบูรณ์ทุก Phase (0-6)** — Production-ready พร้อมใช้งานจริง /
พร้อมแพ็กสำหรับอัปโหลด Chrome Web Store

## Screenshots

_(ใส่ภาพหน้าจอจริงที่นี่ก่อนเผยแพร่ — แนะนำ: หน้าเพิ่ม skill, หน้ารายการพร้อมค้นหา/
กรองหมวดหมู่, โหมดแก้ไข, และหน้า popup ในธีมมืด)_

| ธีมสว่าง | ธีมมืด |
|----------|--------|
| _screenshot placeholder_ | _screenshot placeholder_ |

## โครงสร้างโปรเจกต์

```
.
├── manifest.json
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── content/
│   └── content.js
├── utils/
│   ├── storage.js
│   └── storage.test.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## วิธีติดตั้ง (โหมดนักพัฒนา)

1. เปิด `chrome://extensions`
2. เปิดสวิตช์ "Developer mode" (มุมขวาบน)
3. คลิก "Load unpacked" แล้วเลือกโฟลเดอร์นี้ (โฟลเดอร์ที่มี `manifest.json`)
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
- `exportJSON()` — สำรองข้อมูลทั้งหมดเป็น JSON string
- `importJSON(jsonString, { mode })` — นำเข้าข้อมูล (validate schema ก่อนเสมอ)
  - `mode: "replace"` (ค่าเริ่มต้น) แทนที่ข้อมูลเดิมทั้งหมด
  - `mode: "merge"` รวมกับข้อมูลเดิมโดย id ไม่ซ้ำ (id ชนกัน → ใช้รายการที่ updatedAt ใหม่กว่า)

### วิธีทดสอบ

1. Load unpacked แล้วเปิด popup → คลิกขวา → Inspect เพื่อเปิด DevTools ของ popup
2. ใน Console พิมพ์ import สคริปต์ทดสอบ หรือ copy โค้ดจาก
   `utils/storage.test.js` ไปวางใน Console
3. เรียก `runStorageTests()` แล้วดูผลสรุปผ่าน/ไม่ผ่านของแต่ละเคส

## หน้า Popup (Phase 2 + 4)

ฟีเจอร์ที่ใช้งานได้แล้ว:

- เพิ่ม skill ผ่านฟอร์ม (ชื่อ, เนื้อหา, หมวดหมู่) พร้อม validation ภาษาไทย
- แสดงรายการ skill เรียงจากอัปเดตล่าสุดไปเก่าสุด
- คัดลอกเนื้อหา skill ไปยัง clipboard (ปุ่ม 📋) พร้อม toast แจ้งเตือน
- ลบ skill (ปุ่ม 🗑️) พร้อม confirm ก่อนลบ
- Empty state เมื่อยังไม่มี skill ("ยังไม่มี skill ในเทปของคุณ 🎵")

- ปุ่ม 🚀 Use — ส่งเนื้อหา skill ไปแทรกในช่องแชทของแท็บที่เปิดอยู่ (ChatGPT/Claude)
- ค้นหา skill แบบ realtime (ปุ่ม ✏️ แก้ไข ด้านล่าง)
- Export / Import ข้อมูลเป็นไฟล์ JSON, กรองตามหมวดหมู่ด้วย chip

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

## ค้นหา + แก้ไข (Phase 4)

state ของ popup ทั้งหมดรวมไว้ที่ object เดียว (`popup.js`):

```js
{ skills: [], editingId: null, searchTerm: "", categoryFilter: "all" }
```

**ค้นหา**
- พิมพ์ในช่องค้นหา → filter realtime ทั้ง name, content, category (label ไทย
  และค่า category ดิบ), tags — debounce 150ms กันการ render ถี่เกินไป
- แสดง "พบ X skills" เมื่อมีคำค้นหา
- ไม่เจอผลลัพธ์ → แสดง empty state แยกต่างหาก ("ไม่เจอ skill ที่ค้นหา 🔍")
  คนละอันกับ empty state ตอนยังไม่มี skill เลย

**แก้ไข**
- ปุ่ม ✏️ ต่อรายการ → โหลดค่าเดิมเข้าฟอร์ม, ฟอร์มมีกรอบไฮไลต์, ปุ่มบันทึก
  เปลี่ยนเป็น "🔄 อัปเดต skill", มีปุ่ม "ยกเลิกการแก้ไข" โผล่มา
- บันทึกระหว่างแก้ไข → เรียก `updateSkill(id, patch)` คง id เดิม ไม่สร้างรายการซ้ำ
- ยกเลิกการแก้ไข หรือ ลบ skill ที่กำลังแก้ไขอยู่ → กลับสู่โหมดเพิ่มปกติ

### วิธีทดสอบ

1. เพิ่ม skill หลายรายการ แล้วลองพิมพ์ค้นหาบางส่วนของชื่อ/เนื้อหา/หมวดหมู่
   → รายการควรกรองแบบ realtime และมี "พบ X skills" กำกับ
2. ค้นหาคำที่ไม่มีอยู่จริง → ควรเห็น "ไม่เจอ skill ที่ค้นหา 🔍"
3. กด ✏️ ที่รายการใดก็ได้ → ฟอร์มควรโหลดค่าขึ้นมาและปุ่มเปลี่ยนเป็นโหมดอัปเดต
4. แก้ไขแล้วกดบันทึก → ต้องไม่มีรายการซ้ำ และค่าต้องอัปเดตถูกต้อง
5. กด "ยกเลิกการแก้ไข" → ฟอร์มต้องล้างค่าและกลับสู่โหมดเพิ่มปกติ

## Export / Import + Categories (Phase 5)

**Export**
- ปุ่ม ⬇️ Export → ดึง skills ทั้งหมด → สร้าง Blob → ดาวน์โหลดไฟล์
  `skilltape-backup-YYYYMMDD.json` ผ่าน `<a download>`

**Import**
- ปุ่ม ⬆️ Import → เปิด file picker ที่ซ่อนไว้ (`accept=".json"`)
- อ่านไฟล์ → validate schema ผ่าน `storage.js` ก่อนเสมอ
- ถามยืนยันด้วย `confirm()`: **ตกลง** = แทนที่ข้อมูลทั้งหมด (`mode: "replace"`),
  **ยกเลิก** = รวมกับข้อมูลเดิมโดย id ไม่ซ้ำ (`mode: "merge"`)
- ไฟล์ผิด schema → แสดง error เป็น toast ภาษาไทย ไม่กระทบข้อมูลเดิม

**Category filter**
- แถว chip เหนือรายการ: ทั้งหมด / ทั่วไป / โค้ดดิ้ง / งานเขียน / ธุรกิจ
- คลิก chip → กรองร่วมกับคำค้นหาแบบ AND logic พร้อมอัปเดต "พบ X skills"

### วิธีทดสอบ

1. เพิ่ม skill 2-3 รายการ แล้วกด Export → ควรได้ไฟล์ `.json` ที่มีข้อมูลครบ
2. ลบ/แก้ไขข้อมูลบางส่วน แล้ว Import ไฟล์ที่ export ไว้แบบ **แทนที่** →
   ข้อมูลต้องกลับไปตรงกับตอน export 100%
3. เพิ่ม skill ใหม่อีกอันแล้ว Import ไฟล์เดิมแบบ **รวมกับข้อมูลเดิม** →
   skill ใหม่ต้องไม่หาย และไม่มีรายการซ้ำ
4. ลองเลือก chip หมวดหมู่ต่างๆ ร่วมกับพิมพ์คำค้นหา → ผลลัพธ์ต้องตรงทั้งสองเงื่อนไข
5. ลอง Import ไฟล์ JSON ที่ผิด schema → ต้องเห็น toast แจ้ง error ภาษาไทย
   และข้อมูลเดิมต้องไม่หาย

## ทดสอบเต็มรูปแบบ (Phase 6)

### Checklist ทดสอบ

**Functional**
- [x] เพิ่ม/แก้/ลบ/ค้น/คัดลอก/ใช้ ครบทุกปุ่ม
- [x] Export → ล้างข้อมูล → Import แบบแทนที่ → ข้อมูลกลับมาตรงกัน 100%
- [x] `runStorageTests()` ผ่านครบ 11/11 เคส (รวมเคส import แบบเก่าและใหม่)

**Compatibility**
- [x] Content script ระบุ matches ครบ 3 โดเมน: chat.openai.com, chatgpt.com,
  claude.ai (ตรวจสอบใน manifest.json)
- [x] Light/Dark mode สลับด้วย `prefers-color-scheme` ถูกต้องทั้งสองธีม
  (ดูภาพตัวอย่างในโฟลเดอร์ทดสอบ)
- [ ] ทดสอบแทรกข้อความจริงบน ChatGPT/Claude.ai ที่ล็อกอินอยู่ — **ต้องทำโดยผู้ใช้**
  เนื่องจากสภาพแวดล้อมนี้ไม่มีบัญชีล็อกอินจริง และ DOM ของเว็บเหล่านี้เปลี่ยนได้บ่อย

**Edge cases**
- [x] Skill เนื้อหายาว 10,000 ตัวอักษร — บันทึกและอ่านค่ากลับมาครบถ้วน
- [x] ชื่อ/เนื้อหามี emoji, ภาษาไทย, และ HTML tag (`<script>`, `<img onerror>`)
  — render เป็นข้อความล้วน ไม่มี tag ถูกแทรกเข้า DOM จริง ไม่มี alert ทำงาน
- [x] ลบข้อมูลทั้งหมด → กลับสู่ empty state ถูกต้อง

**Security**
- [x] ชื่อและเนื้อหา skill render ผ่าน `textContent` เสมอ (ไม่ใช้ `innerHTML`
  กับข้อมูลผู้ใช้ที่ไหนเลยในโค้ดทั้งโปรเจกต์) — ป้องกัน XSS ยืนยันด้วยเทสต์อัตโนมัติ
- [x] ไม่มี `console.log` ค้างในไฟล์ production (`popup.js`, `content.js`, `storage.js`)

### วิธีรันชุดทดสอบอัตโนมัติทั้งหมด (สำหรับนักพัฒนา)

โปรเจกต์นี้เป็น vanilla JS ไม่มี build step จึงทดสอบผ่าน headless browser
ตรงๆ ได้ (ตัวอย่างใช้ Playwright แต่ไม่ใช่ dependency ของโปรเจกต์):

1. เปิดไฟล์ `popup/popup.html` ในเบราว์เซอร์ (หรือโหลดผ่าน
   extension unpacked) พร้อม mock `chrome.storage`/`chrome.tabs` หากรันนอก
   context ของ extension จริง
2. ทดสอบ storage layer: inject `storage.js` + `storage.test.js` แล้วเรียก
   `runStorageTests()`
3. ทดสอบ UI: จำลอง add/search/edit/delete/export/import ผ่าน DOM events
   ตามรายการ "วิธีทดสอบ" ของแต่ละ Phase ด้านบน

### Troubleshooting

| ปัญหา | สาเหตุที่เป็นไปได้ / วิธีแก้ |
|-------|-------------------------------|
| กด 🚀 Use แล้วไม่มีอะไรเกิดขึ้น | ตรวจว่าแท็บที่ active อยู่เป็น chat.openai.com, chatgpt.com หรือ claude.ai และรีเฟรชหน้านั้นหลัง Load unpacked ใหม่ (content script จะฉีดหลัง reload เท่านั้น) |
| แทรกข้อความไม่เข้าช่องแชท | DOM ของเว็บ AI อาจเปลี่ยน — ตรวจสอบ selector ใน `content/content.js` (`findChatInput`) และปรับ selector ให้ตรงกับโครงสร้างปัจจุบัน |
| ข้อมูลหายหลัง Import | ตรวจว่าเลือกโหมดถูกต้องตอนกด confirm (ตกลง = แทนที่ทั้งหมด, ยกเลิก = รวมกับข้อมูลเดิม) |
| Popup ไม่แสดงข้อมูลที่บันทึกไว้ | เปิด DevTools ของ popup แล้วเช็ค error ใน console, ตรวจสอบว่า permission `storage` ยังอยู่ใน manifest.json |
| ไอคอนไม่ขึ้นหรือขึ้นเป็นสีเทา | ลอง Remove แล้ว Load unpacked ใหม่, ตรวจว่าไฟล์ icons/*.png ยังอยู่ครบ |

## เตรียมไฟล์สำหรับอัปโหลด Chrome Web Store

```bash
zip -r skilltape-v0.1.0.zip . -x "*.test.js" -x ".git/*" -x "skilltape-v0.1.0.zip"
```

ไฟล์ `skilltape-v0.1.0.zip` ที่ได้พร้อมอัปโหลดที่
[Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
(อย่าลืมอัปเดต `version` ใน `manifest.json` ก่อน build ทุกครั้งที่ปล่อยเวอร์ชันใหม่)
