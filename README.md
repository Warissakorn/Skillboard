# Skilltape 🎧

> your mixtape of prompts

Chrome Extension (Manifest V3) สำหรับจัดเก็บ Skill/Prompt ของคุณ และแทรกลงช่องแชท
ของ ChatGPT หรือ Claude ได้ในคลิกเดียว — ไม่มี dependency, ไม่มี build step,
เขียนด้วย vanilla JavaScript (ES2022) ล้วน

**สถานะ:** พัฒนาเสร็จสมบูรณ์ พร้อมใช้งานจริงและพร้อมแพ็กสำหรับอัปโหลด
Chrome Web Store

---

## ติดตั้ง (โหมดนักพัฒนา)

1. เปิด `chrome://extensions`
2. เปิดสวิตช์ **Developer mode** (มุมขวาบน)
3. คลิก **Load unpacked** แล้วเลือกโฟลเดอร์นี้ (โฟลเดอร์ที่มี `manifest.json`)
4. ไอคอน Skilltape จะปรากฏบน toolbar

**เว็บไซต์ที่รองรับการแทรกข้อความ:** chat.openai.com, chatgpt.com, claude.ai

---

## ฟีเจอร์

- **เพิ่ม/แก้ไข/ลบ** skill ผ่านฟอร์ม (ชื่อ, เนื้อหา, หมวดหมู่) พร้อม validation
  ภาษาไทย — แก้ไขโดยกด ✏️ ที่รายการ ฟอร์มจะโหลดค่าเดิมขึ้นมาให้แก้แล้วอัปเดต
  โดยไม่สร้างรายการซ้ำ
- **🚀 Use** — ส่งเนื้อหา skill ไปแทรกในช่องแชทของแท็บ AI ที่เปิดอยู่ทันที
- **📋 คัดลอก** เนื้อหา skill ไปยัง clipboard
- **ค้นหาแบบ realtime** (debounce 150ms) ครอบคลุมชื่อ เนื้อหา หมวดหมู่ และ tags
  พร้อมตัวนับผลลัพธ์ "พบ X skills"
- **กรองตามหมวดหมู่** ด้วย chip (ทั้งหมด/ทั่วไป/โค้ดดิ้ง/งานเขียน/ธุรกิจ) ใช้ร่วมกับ
  การค้นหาแบบ AND ได้
- **Export/Import** เป็นไฟล์ `.json` — import เลือกได้ว่าจะแทนที่ข้อมูลเดิมทั้งหมด
  หรือรวมกับข้อมูลเดิมแบบไม่ซ้ำ id
- รองรับ **dark mode** อัตโนมัติตาม `prefers-color-scheme`
- ข้อมูลทั้งหมด render ผ่าน `textContent` เท่านั้น ป้องกัน XSS จากชื่อ/เนื้อหา skill

---

## โครงสร้างโปรเจกต์

```
.
├── manifest.json          # Chrome Extension Manifest V3
├── popup/
│   ├── popup.html          # โครง UI ของ popup
│   ├── popup.css           # สไตล์ + ธีม light/dark
│   └── popup.js            # state + event handlers ทั้งหมดของ popup
├── content/
│   └── content.js          # แทรกข้อความลงช่องแชทของหน้า AI
├── utils/
│   ├── storage.js          # wrapper สำหรับ chrome.storage.local
│   └── storage.test.js     # ชุดทดสอบ storage.js (รันเองใน console)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Storage Layer (`utils/storage.js`)

wrapper สำหรับ `chrome.storage.local` เปิดใช้เป็น global object
`window.SkilltapeStorage`:

| ฟังก์ชัน | คำอธิบาย |
|---|---|
| `getSkills()` | ดึง skill ทั้งหมด |
| `saveSkill(skill)` | สร้างใหม่ (ไม่มี id) หรืออัปเดต (มี id เดิม) |
| `updateSkill(id, patch)` | อัปเดตบางฟิลด์ตาม id, ตั้ง `updatedAt` ใหม่เสมอ |
| `deleteSkill(id)` | ลบตาม id |
| `exportJSON()` | สำรองข้อมูลทั้งหมดเป็น JSON string |
| `importJSON(jsonString, { mode })` | นำเข้าข้อมูล — validate schema ก่อนเสมอ<br>`mode: "replace"` (ค่าเริ่มต้น) แทนที่ทั้งหมด<br>`mode: "merge"` รวมกับข้อมูลเดิมโดย id ไม่ซ้ำ (id ชนกันใช้ตัวที่ `updatedAt` ใหม่กว่า) |

**Data model:**

```js
{
  id: "uuid-v4",
  name: "string",
  content: "string",
  category: "general" | "coding" | "writing" | "business",
  tags: ["string"],
  createdAt: 1234567890,   // epoch-ms
  updatedAt: 1234567890,   // epoch-ms
}
```

### รันชุดทดสอบ storage

1. Load unpacked แล้วเปิด popup → คลิกขวา → **Inspect** เพื่อเปิด DevTools
2. Copy โค้ดจาก `utils/storage.test.js` ไปวางใน Console
3. เรียก `runStorageTests()` — จะล้าง storage ก่อนเริ่ม แล้วรัน 11 เคส
   (CRUD, กันรายการซ้ำ, export/import round-trip, reject schema ผิด) แล้ว
   ล้าง storage อีกครั้งหลังจบ

---

## Content Script (`content/content.js`)

ถูกฉีดเข้าเฉพาะหน้า chat.openai.com, chatgpt.com, และ claude.ai (ตาม
`content_scripts.matches` ใน `manifest.json`) รอรับ message
`{ type: "INSERT_SKILL", text }` จาก popup แล้ว:

1. หาช่องแชทด้วย selector เรียงลำดับ: `textarea` → `[contenteditable="true"]`
   → `div[role="textbox"]` (เลือกตัวแรกที่มองเห็นได้และไม่ disabled)
2. ถ้าเป็น `<textarea>` — set ค่าผ่าน native setter แล้ว dispatch `input` event
   (จำเป็นสำหรับ React-controlled input อย่าง ChatGPT)
3. ถ้าเป็น contenteditable — เลือกเนื้อหาเดิมทั้งหมดแล้วใช้
   `document.execCommand("insertText")` แทนที่ (มี fallback เป็น `textContent`)
4. ถ้าหาช่องแชทไม่เจอ → ตอบกลับ `{ success: false }` และ popup จะแสดง toast
   เตือนให้เปิดหน้า AI ก่อน

**ทดสอบ:** Load unpacked → เปิดแท็บ ChatGPT หรือ Claude.ai → เปิด popup →
กด 🚀 บน skill ใดก็ได้ → ข้อความควรปรากฏในช่องแชททันทีพร้อม toast
"แทรกแล้ว! กด Enter เพื่อส่ง" ลองกด 🚀 บนแท็บเว็บอื่นดูด้วย ควรเห็น toast
เตือนโดยไม่ crash

> **หมายเหตุ:** DOM ของ ChatGPT/Claude.ai เปลี่ยนได้บ่อย หากปุ่ม Use ใช้ไม่ได้
> อีกต่อไป ให้ตรวจสอบและปรับ selector ใน `findChatInput()` ก่อน

---

## Troubleshooting

| ปัญหา | สาเหตุที่เป็นไปได้ / วิธีแก้ |
|---|---|
| กด 🚀 Use แล้วไม่มีอะไรเกิดขึ้น | ตรวจว่าแท็บที่ active อยู่เป็น chat.openai.com, chatgpt.com หรือ claude.ai และรีเฟรชหน้านั้นหลัง Load unpacked ใหม่ (content script จะฉีดหลัง reload เท่านั้น) |
| แทรกข้อความไม่เข้าช่องแชท | DOM ของเว็บ AI อาจเปลี่ยน — ตรวจสอบ selector ใน `content/content.js` (`findChatInput`) |
| ข้อมูลหายหลัง Import | ตรวจว่าเลือกโหมดถูกต้องตอนกด confirm (ตกลง = แทนที่ทั้งหมด, ยกเลิก = รวมกับข้อมูลเดิม) |
| Popup ไม่แสดงข้อมูลที่บันทึกไว้ | เปิด DevTools ของ popup แล้วเช็ค error ใน console, ตรวจสอบว่า permission `storage` ยังอยู่ใน manifest.json |
| ไอคอนไม่ขึ้นหรือขึ้นเป็นสีเทา | ลอง Remove แล้ว Load unpacked ใหม่, ตรวจว่าไฟล์ icons/*.png ยังอยู่ครบ |

---

## แพ็กสำหรับอัปโหลด Chrome Web Store

```bash
zip -r skilltape-v0.1.0.zip . -x "*.test.js" -x ".git/*" -x "*.zip"
```

อัปโหลดไฟล์ `.zip` ที่ได้ที่
[Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
(อย่าลืมอัปเดต `version` ใน `manifest.json` ก่อน build ทุกครั้งที่ปล่อยเวอร์ชันใหม่)
