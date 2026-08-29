// popup.js — เพิ่ม/แสดง/ค้นหา/แก้ไข/ลบ/คัดลอก/ใช้ skill และ export/import

const CATEGORY_LABELS = {
  general: "ทั่วไป",
  coding: "โค้ดดิ้ง",
  writing: "งานเขียน",
  business: "ธุรกิจ",
};

const SEARCH_DEBOUNCE_MS = 150;

const els = {
  formSection: document.querySelector(".form-section"),
  form: document.getElementById("skillForm"),
  name: document.getElementById("skillName"),
  content: document.getElementById("skillContent"),
  category: document.getElementById("skillCategory"),
  formError: document.getElementById("formError"),
  saveBtn: document.getElementById("saveBtn"),
  cancelEditBtn: document.getElementById("cancelEditBtn"),
  searchInput: document.getElementById("searchInput"),
  resultCount: document.getElementById("resultCount"),
  list: document.getElementById("skillList"),
  emptyState: document.getElementById("emptyState"),
  noResultsState: document.getElementById("noResultsState"),
  toast: document.getElementById("toast"),
  categoryChips: document.getElementById("categoryChips"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  importFileInput: document.getElementById("importFileInput"),
};

// state ปัจจุบันของ popup ทั้งหมดรวมไว้ที่เดียว
const state = {
  skills: [],
  editingId: null,
  searchTerm: "",
  categoryFilter: "all",
};

let toastTimer = null;
let searchDebounceTimer = null;

function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.hidden = true;
  }, 2000);
}

function showFormError(message) {
  els.formError.textContent = message;
  els.formError.hidden = false;
}

function clearFormError() {
  els.formError.hidden = true;
  els.formError.textContent = "";
}

function resetForm() {
  els.form.reset();
  clearFormError();
}

function enterEditMode(skill) {
  state.editingId = skill.id;
  els.name.value = skill.name;
  els.content.value = skill.content;
  els.category.value = skill.category;
  clearFormError();

  els.formSection.classList.add("editing");
  els.saveBtn.textContent = "🔄 อัปเดต skill";
  els.cancelEditBtn.hidden = false;
  els.name.focus();
}

function exitEditMode() {
  state.editingId = null;
  els.formSection.classList.remove("editing");
  els.saveBtn.textContent = "💾 บันทึก skill";
  els.cancelEditBtn.hidden = true;
  resetForm();
}

function matchesSearch(skill, term) {
  if (!term) return true;
  const haystack = [
    skill.name,
    skill.content,
    CATEGORY_LABELS[skill.category] || skill.category,
    skill.category,
    ...(Array.isArray(skill.tags) ? skill.tags : []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(term.toLowerCase());
}

function matchesCategory(skill, categoryFilter) {
  if (categoryFilter === "all") return true;
  return skill.category === categoryFilter;
}

function createSkillItem(skill) {
  const li = document.createElement("li");
  li.className = "skill-item";
  if (skill.id === state.editingId) {
    li.classList.add("skill-item-editing");
  }

  // ลากการ์ดนี้ไปวางในช่องพิมพ์ของหน้าเว็บได้ (native HTML5 drag-and-drop)
  li.draggable = true;
  li.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", skill.content);
    event.dataTransfer.effectAllowed = "copy";
    li.classList.add("is-dragging");
  });
  li.addEventListener("dragend", () => {
    li.classList.remove("is-dragging");
  });

  const top = document.createElement("div");
  top.className = "skill-item-top";

  const info = document.createElement("div");
  const nameEl = document.createElement("div");
  nameEl.className = "skill-name";
  nameEl.textContent = skill.name; // textContent ป้องกัน XSS
  const categoryEl = document.createElement("span");
  categoryEl.className = "skill-category";
  categoryEl.textContent = CATEGORY_LABELS[skill.category] || skill.category;
  info.appendChild(nameEl);
  info.appendChild(categoryEl);

  const actions = document.createElement("div");
  actions.className = "skill-actions";
  actions.draggable = false; // กันไม่ให้การคลิกปุ่มในการ์ดไปเริ่ม drag โดยไม่ตั้งใจ

  const useBtn = document.createElement("button");
  useBtn.className = "icon-btn";
  useBtn.type = "button";
  useBtn.title = "ใช้ใน AI";
  useBtn.textContent = "🚀";
  useBtn.addEventListener("click", () => handleUse(skill));

  const editBtn = document.createElement("button");
  editBtn.className = "icon-btn";
  editBtn.type = "button";
  editBtn.title = "แก้ไข";
  editBtn.textContent = "✏️";
  editBtn.addEventListener("click", () => enterEditMode(skill));

  const copyBtn = document.createElement("button");
  copyBtn.className = "icon-btn";
  copyBtn.type = "button";
  copyBtn.title = "คัดลอก";
  copyBtn.textContent = "📋";
  copyBtn.addEventListener("click", () => handleCopy(skill));

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "icon-btn";
  deleteBtn.type = "button";
  deleteBtn.title = "ลบ";
  deleteBtn.textContent = "🗑️";
  deleteBtn.addEventListener("click", () => handleDelete(skill));

  actions.appendChild(useBtn);
  actions.appendChild(editBtn);
  actions.appendChild(copyBtn);
  actions.appendChild(deleteBtn);

  top.appendChild(info);
  top.appendChild(actions);

  const preview = document.createElement("div");
  preview.className = "skill-content-preview";
  preview.textContent = skill.content; // textContent ป้องกัน XSS

  li.appendChild(top);
  li.appendChild(preview);

  return li;
}

function render() {
  const filtered = state.skills.filter(
    (s) => matchesSearch(s, state.searchTerm) && matchesCategory(s, state.categoryFilter)
  );
  const sorted = [...filtered].sort((a, b) => b.updatedAt - a.updatedAt);

  els.list.innerHTML = "";

  const hasAnySkills = state.skills.length > 0;
  const hasResults = sorted.length > 0;
  const hasActiveFilter = Boolean(state.searchTerm) || state.categoryFilter !== "all";

  els.emptyState.hidden = hasAnySkills;
  els.noResultsState.hidden = !hasAnySkills || hasResults;

  if (hasActiveFilter) {
    els.resultCount.textContent = `พบ ${sorted.length} skills`;
  } else {
    els.resultCount.textContent = "";
  }

  if (!hasResults) return;

  const fragment = document.createDocumentFragment();
  for (const skill of sorted) {
    fragment.appendChild(createSkillItem(skill));
  }
  els.list.appendChild(fragment);
}

async function refresh() {
  state.skills = await window.SkilltapeStorage.getSkills();
  render();
}

async function handleUse(skill) {
  let tab;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch (e) {
    showToast("ไม่พบแท็บที่ใช้งานอยู่");
    return;
  }

  if (!tab || !tab.id) {
    showToast("ไม่พบแท็บที่ใช้งานอยู่");
    return;
  }

  chrome.tabs.sendMessage(
    tab.id,
    { type: "INSERT_SKILL", text: skill.content },
    (response) => {
      if (chrome.runtime.lastError || !response || !response.success) {
        showToast("ไม่พบช่องพิมพ์ข้อความในหน้านี้ ลองเปิดหน้าแชท AI ก่อนนะ");
        return;
      }
      showToast("แทรกแล้ว! กด Enter เพื่อส่ง");
    }
  );
}

async function handleCopy(skill) {
  try {
    await navigator.clipboard.writeText(skill.content);
    showToast("คัดลอกแล้ว");
  } catch (e) {
    showToast("คัดลอกไม่สำเร็จ");
  }
}

async function handleDelete(skill) {
  const confirmed = window.confirm(`ต้องการลบ "${skill.name}" ใช่หรือไม่?`);
  if (!confirmed) return;
  if (state.editingId === skill.id) {
    exitEditMode();
  }
  await window.SkilltapeStorage.deleteSkill(skill.id);
  await refresh();
  showToast("ลบแล้ว");
}

async function handleSubmit(event) {
  event.preventDefault();
  clearFormError();

  const name = els.name.value.trim();
  const content = els.content.value.trim();
  const category = els.category.value;

  if (!name) {
    showFormError("กรุณาระบุชื่อ skill");
    return;
  }
  if (!content) {
    showFormError("กรุณาระบุเนื้อหา skill");
    return;
  }

  const isEditing = Boolean(state.editingId);

  try {
    if (isEditing) {
      await window.SkilltapeStorage.updateSkill(state.editingId, {
        name,
        content,
        category,
      });
      exitEditMode();
      await refresh();
      showToast("อัปเดตแล้ว");
    } else {
      await window.SkilltapeStorage.saveSkill({ name, content, category });
      resetForm();
      await refresh();
      showToast("บันทึกแล้ว");
    }
  } catch (e) {
    showFormError(e.message || "บันทึกไม่สำเร็จ");
  }
}

function handleSearchInput() {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    state.searchTerm = els.searchInput.value.trim();
    render();
  }, SEARCH_DEBOUNCE_MS);
}

function handleCategoryChipClick(event) {
  const chip = event.target.closest(".chip");
  if (!chip) return;

  state.categoryFilter = chip.dataset.category;
  for (const el of els.categoryChips.querySelectorAll(".chip")) {
    el.classList.toggle("is-active", el === chip);
  }
  render();
}

function todayStamp() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

async function handleExport() {
  try {
    const json = await window.SkilltapeStorage.exportJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `skilltape-backup-${todayStamp()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    showToast("Export สำเร็จ");
  } catch (e) {
    showToast("Export ไม่สำเร็จ");
  }
}

function handleImportClick() {
  els.importFileInput.click();
}

async function handleImportFileChange(event) {
  const file = event.target.files && event.target.files[0];
  els.importFileInput.value = ""; // ให้เลือกไฟล์เดิมซ้ำได้อีกครั้ง
  if (!file) return;

  const replaceAll = window.confirm(
    'นำเข้าไฟล์นี้อย่างไร?\nกด "ตกลง" เพื่อแทนที่ข้อมูลทั้งหมด\nกด "ยกเลิก" เพื่อรวมกับข้อมูลเดิม (merge)'
  );

  try {
    const text = await file.text();
    await window.SkilltapeStorage.importJSON(text, {
      mode: replaceAll ? "replace" : "merge",
    });
    if (state.editingId) {
      exitEditMode();
    }
    await refresh();
    showToast("Import สำเร็จ");
  } catch (e) {
    showToast(e.message || "Import ไม่สำเร็จ");
  }
}

els.form.addEventListener("submit", handleSubmit);
els.cancelEditBtn.addEventListener("click", exitEditMode);
els.searchInput.addEventListener("input", handleSearchInput);
els.categoryChips.addEventListener("click", handleCategoryChipClick);
els.exportBtn.addEventListener("click", handleExport);
els.importBtn.addEventListener("click", handleImportClick);
els.importFileInput.addEventListener("change", handleImportFileChange);

refresh();
