// Phase 2: UI พื้นฐาน — เพิ่ม/แสดง/ลบ/คัดลอก skill

const CATEGORY_LABELS = {
  general: "ทั่วไป",
  coding: "โค้ดดิ้ง",
  writing: "งานเขียน",
  business: "ธุรกิจ",
};

const els = {
  form: document.getElementById("skillForm"),
  name: document.getElementById("skillName"),
  content: document.getElementById("skillContent"),
  category: document.getElementById("skillCategory"),
  formError: document.getElementById("formError"),
  saveBtn: document.getElementById("saveBtn"),
  list: document.getElementById("skillList"),
  emptyState: document.getElementById("emptyState"),
  toast: document.getElementById("toast"),
};

let toastTimer = null;

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

function createSkillItem(skill) {
  const li = document.createElement("li");
  li.className = "skill-item";

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

function renderSkills(skills) {
  const sorted = [...skills].sort((a, b) => b.updatedAt - a.updatedAt);

  els.list.innerHTML = "";
  if (sorted.length === 0) {
    els.emptyState.hidden = false;
    return;
  }
  els.emptyState.hidden = true;

  const fragment = document.createDocumentFragment();
  for (const skill of sorted) {
    fragment.appendChild(createSkillItem(skill));
  }
  els.list.appendChild(fragment);
}

async function refresh() {
  const skills = await window.SkilltapeStorage.getSkills();
  renderSkills(skills);
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

  try {
    await window.SkilltapeStorage.saveSkill({ name, content, category });
    resetForm();
    await refresh();
    showToast("บันทึกแล้ว");
  } catch (e) {
    showFormError(e.message || "บันทึกไม่สำเร็จ");
  }
}

els.form.addEventListener("submit", handleSubmit);

refresh();
