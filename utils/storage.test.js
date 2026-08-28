// การทดสอบ storage.js แบบง่าย (ไม่ใช้ test framework)
//
// วิธีรัน:
// 1. เปิด popup ของ Skilltape แล้วเปิด DevTools (คลิกขวา → Inspect)
// 2. โหลดสคริปต์นี้ในหน้า popup (เช่น เพิ่ม <script src="../utils/storage.test.js">
//    ใน popup.html ชั่วคราว หรือ copy โค้ดไปวางใน Console)
// 3. เรียก runStorageTests() ใน Console แล้วดูผลลัพธ์
//
// หมายเหตุ: ทดสอบนี้ใช้ chrome.storage.local จริง จะ "ล้างข้อมูลทั้งหมด"
// ก่อนเริ่มและหลังจบการทดสอบ — อย่ารันบน storage ที่มีข้อมูลจริงที่ต้องการเก็บ

async function runStorageTests() {
  const results = [];

  function assert(condition, message) {
    results.push({ pass: !!condition, message });
    if (!condition) {
      console.error("✗ FAIL:", message);
    } else {
      console.log("✓ PASS:", message);
    }
  }

  // เริ่มจาก storage ว่าง
  await chrome.storage.local.clear();

  // 1. storage ว่าง → getSkills() คืน []
  const empty = await window.SkilltapeStorage.getSkills();
  assert(Array.isArray(empty) && empty.length === 0, "getSkills() บน storage ว่างต้องคืน []");

  // 2. saveSkill สร้างใหม่ (ไม่มี id)
  const created = await window.SkilltapeStorage.saveSkill({
    name: "ทดสอบ",
    content: "เนื้อหาทดสอบ",
    category: "coding",
    tags: ["test"],
  });
  assert(typeof created.id === "string" && created.id.length > 0, "saveSkill ต้อง generate id ให้อัตโนมัติ");
  assert(typeof created.createdAt === "number", "saveSkill ต้อง set createdAt");

  // 3. saveSkill ซ้ำ id เดิม → update ไม่ใช่สร้างใหม่
  const updated = await window.SkilltapeStorage.saveSkill({
    id: created.id,
    name: "ทดสอบ (แก้ไข)",
    content: "เนื้อหาใหม่",
    category: "coding",
    tags: ["test"],
  });
  const afterUpdate = await window.SkilltapeStorage.getSkills();
  assert(afterUpdate.length === 1, "saveSkill ด้วย id เดิม ต้องไม่สร้างรายการซ้ำ (ยังมี 1 รายการ)");
  assert(updated.name === "ทดสอบ (แก้ไข)", "saveSkill ด้วย id เดิม ต้องอัปเดตค่าใหม่");

  // 4. updateSkill แก้บางฟิลด์
  const patched = await window.SkilltapeStorage.updateSkill(created.id, { name: "ชื่อใหม่" });
  assert(patched.name === "ชื่อใหม่", "updateSkill ต้องอัปเดตฟิลด์ที่ระบุ");
  assert(patched.content === "เนื้อหาใหม่", "updateSkill ต้องคงฟิลด์ที่ไม่ได้ระบุไว้เหมือนเดิม");

  // 5. deleteSkill
  await window.SkilltapeStorage.deleteSkill(created.id);
  const afterDelete = await window.SkilltapeStorage.getSkills();
  assert(afterDelete.length === 0, "deleteSkill ต้องลบรายการออกจาก storage");

  // 6. exportJSON / importJSON round-trip
  await window.SkilltapeStorage.saveSkill({ name: "A", content: "1" });
  await window.SkilltapeStorage.saveSkill({ name: "B", content: "2" });
  const exported = await window.SkilltapeStorage.exportJSON();
  await chrome.storage.local.clear();
  const imported = await window.SkilltapeStorage.importJSON(exported);
  assert(imported.length === 2, "importJSON ต้องนำเข้าข้อมูลที่ export ออกมาได้ครบ");

  // 7. importJSON กับข้อมูลปลอม → throw error
  let threw = false;
  try {
    await window.SkilltapeStorage.importJSON('{"not_skills": true}');
  } catch (e) {
    threw = true;
  }
  assert(threw, "importJSON ด้วยข้อมูลที่ schema ผิด ต้อง throw error");

  let threwInvalidJson = false;
  try {
    await window.SkilltapeStorage.importJSON("ไม่ใช่ json");
  } catch (e) {
    threwInvalidJson = true;
  }
  assert(threwInvalidJson, "importJSON ด้วยข้อความที่ไม่ใช่ JSON ต้อง throw error");

  // ล้าง storage หลังทดสอบเสร็จ
  await chrome.storage.local.clear();

  const failed = results.filter((r) => !r.pass);
  console.log(`\nสรุปผลทดสอบ: ผ่าน ${results.length - failed.length}/${results.length}`);
  return failed.length === 0;
}

if (typeof window !== "undefined") {
  window.runStorageTests = runStorageTests;
}
