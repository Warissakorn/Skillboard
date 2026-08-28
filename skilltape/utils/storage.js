// Storage Layer — wrapper สำหรับ chrome.storage.local
// เก็บข้อมูลทั้งหมดไว้ใต้ key เดียว "skills" เป็น array ของ Skill object
//
// Skill = {
//   id: string (uuid-v4),
//   name: string,
//   content: string,
//   category: "general" | "coding" | "writing" | "business",
//   tags: string[],
//   createdAt: number (epoch-ms),
//   updatedAt: number (epoch-ms)
// }

const STORAGE_KEY = "skills";
const VALID_CATEGORIES = ["general", "coding", "writing", "business"];

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // fallback แบบ uuid-v4 อย่างง่าย เผื่อ crypto.randomUUID ไม่มี
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readAll() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(Array.isArray(result[STORAGE_KEY]) ? result[STORAGE_KEY] : []);
    });
  });
}

function writeAll(skills) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [STORAGE_KEY]: skills }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}

/**
 * ดึง skill ทั้งหมด (storage ว่าง → คืน array ว่าง)
 */
async function getSkills() {
  return readAll();
}

/**
 * บันทึก skill — ถ้าไม่มี id (หรือ id ยังไม่มีอยู่จริง) จะสร้างใหม่พร้อม createdAt
 * ถ้ามี id อยู่แล้ว จะถือเป็นการอัปเดต (set updatedAt)
 */
async function saveSkill(skill) {
  if (!skill || typeof skill.name !== "string" || !skill.name.trim()) {
    throw new Error("กรุณาระบุชื่อ skill");
  }
  if (typeof skill.content !== "string" || !skill.content.trim()) {
    throw new Error("กรุณาระบุเนื้อหา skill");
  }

  const category = VALID_CATEGORIES.includes(skill.category)
    ? skill.category
    : "general";
  const tags = Array.isArray(skill.tags) ? skill.tags : [];

  const skills = await readAll();
  const now = Date.now();

  const existingIndex = skill.id
    ? skills.findIndex((s) => s.id === skill.id)
    : -1;

  if (existingIndex >= 0) {
    const updated = {
      ...skills[existingIndex],
      name: skill.name.trim(),
      content: skill.content,
      category,
      tags,
      updatedAt: now,
    };
    skills[existingIndex] = updated;
    await writeAll(skills);
    return updated;
  }

  const created = {
    id: generateId(),
    name: skill.name.trim(),
    content: skill.content,
    category,
    tags,
    createdAt: now,
    updatedAt: now,
  };
  skills.push(created);
  await writeAll(skills);
  return created;
}

/**
 * อัปเดต skill ตาม id ด้วยข้อมูลบางส่วน (patch) — set updatedAt เสมอ
 */
async function updateSkill(id, patch) {
  if (!id) {
    throw new Error("ไม่พบ id ของ skill ที่ต้องการอัปเดต");
  }
  const skills = await readAll();
  const index = skills.findIndex((s) => s.id === id);
  if (index < 0) {
    throw new Error("ไม่พบ skill ที่ต้องการอัปเดต");
  }

  const next = { ...skills[index], ...patch, id: skills[index].id };
  if (patch && patch.category && !VALID_CATEGORIES.includes(patch.category)) {
    next.category = skills[index].category;
  }
  next.updatedAt = Date.now();

  skills[index] = next;
  await writeAll(skills);
  return next;
}

/**
 * ลบ skill ตาม id
 */
async function deleteSkill(id) {
  const skills = await readAll();
  const next = skills.filter((s) => s.id !== id);
  await writeAll(next);
  return next;
}

/**
 * export ข้อมูลทั้งหมดเป็น JSON string
 */
async function exportJSON() {
  const skills = await readAll();
  return JSON.stringify({ skills }, null, 2);
}

function validateImportShape(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.skills)) {
    throw new Error("ไฟล์ที่นำเข้าไม่ถูกต้อง: ไม่พบรายการ skills");
  }
  for (const s of data.skills) {
    if (
      typeof s.id !== "string" ||
      typeof s.name !== "string" ||
      typeof s.content !== "string" ||
      typeof s.createdAt !== "number" ||
      typeof s.updatedAt !== "number"
    ) {
      throw new Error("ไฟล์ที่นำเข้าไม่ถูกต้อง: โครงสร้างข้อมูล skill ไม่ครบถ้วน");
    }
  }
  return data.skills.map((s) => ({
    id: s.id,
    name: s.name,
    content: s.content,
    category: VALID_CATEGORIES.includes(s.category) ? s.category : "general",
    tags: Array.isArray(s.tags) ? s.tags : [],
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));
}

/**
 * import ข้อมูลจาก JSON string — validate schema ก่อนเสมอ
 * mode: "replace" (ค่าเริ่มต้น) แทนที่ข้อมูลเดิมทั้งหมด
 *       "merge" รวมกับข้อมูลเดิมโดย id ไม่ซ้ำ (ถ้า id ชนกัน ใช้รายการที่ updatedAt ใหม่กว่า)
 */
async function importJSON(jsonString, options = {}) {
  const mode = options.mode === "merge" ? "merge" : "replace";

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    throw new Error("ไฟล์ที่นำเข้าไม่ใช่ JSON ที่ถูกต้อง");
  }

  const imported = validateImportShape(parsed);

  if (mode === "replace") {
    await writeAll(imported);
    return imported;
  }

  const existing = await readAll();
  const byId = new Map(existing.map((s) => [s.id, s]));
  for (const skill of imported) {
    const current = byId.get(skill.id);
    if (!current || skill.updatedAt >= current.updatedAt) {
      byId.set(skill.id, skill);
    }
  }
  const merged = Array.from(byId.values());
  await writeAll(merged);
  return merged;
}

// เผยแพร่เป็น global object เดียว เพื่อให้ popup.js เรียกใช้ได้ตรงๆ
// (โปรเจกต์นี้เป็น vanilla JS ไม่ใช้ module bundler)
window.SkilltapeStorage = {
  getSkills,
  saveSkill,
  updateSkill,
  deleteSkill,
  exportJSON,
  importJSON,
};
