// Phase 4: ค้นหา + แก้ไข skill

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
};

// state ปัจจุบันของ popup ทั้งหมดรวมไว้ที่เดียว
const state = {
  skills: [],
  editingId: null,
  searchTerm: "",
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

function createSkillItem(skill) {
  const li = document.createElement("li");
  li.className = "skill-item";
  if (skill.id === state.editingId) {
    li.classList.add("skill-item-editing");
  }

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
  const filtered = state.skills.filter((s) => matchesSearch(s, state.searchTerm));
  const sorted = [...filtered].sort((a, b) => b.updatedAt - a.updatedAt);

  els.list.innerHTML = "";

  const hasAnySkills = state.skills.length > 0;
  const hasResults = sorted.length > 0;

  els.emptyState.hidden = hasAnySkills;
  els.noResultsState.hidden = !hasAnySkills || hasResults;

  if (state.searchTerm) {
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
        showToast("เปิดหน้า AI ก่อนนะ (ChatGPT หรือ Claude)");
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

els.form.addEventListener("submit", handleSubmit);
els.cancelEditBtn.addEventListener("click", exitEditMode);
els.searchInput.addEventListener("input", handleSearchInput);

refresh();
