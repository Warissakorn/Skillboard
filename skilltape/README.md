# Skilltape 🎧

> your mixtape of prompts

Chrome Extension (Manifest V3) สำหรับจัดเก็บและใช้งาน Skill/Prompt ของคุณ
ร่วมกับ ChatGPT และ Claude ได้อย่างรวดเร็ว

## สถานะโปรเจกต์

กำลังพัฒนาแบบแบ่ง Phase — ปัจจุบันอยู่ที่ **Phase 1: Storage Layer + Data Model**

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
