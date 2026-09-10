// Bundled data only; installing a starter never executes downloaded code.
(() => {
  const dialog = document.getElementById('starterDialog');
  const list = document.getElementById('starterList');
  const error = document.getElementById('starterError');
  let catalog, busy = false;
  async function renderStarters() {
    const saved = await window.SkilltapeStorage.getSkills();
    const ids = new Set(saved.map(skill => skill.id));
    list.replaceChildren();
    for (const skill of catalog.skills) {
      const item = document.createElement('section');
      item.className = 'starter-item';
      const name = document.createElement('h3'); name.textContent = skill.name;
      const description = document.createElement('p'); description.textContent = skill.description[locale] || skill.description.en;
      const adaptation = document.createElement('p'); adaptation.textContent = t('ดัดแปลงสำหรับใช้ในแชท');
      const source = document.createElement('a'); source.textContent = 'GitHub · MIT'; source.href = skill.source; source.target = '_blank'; source.rel = 'noopener noreferrer';
      const details = document.createElement('details');
      const summary = document.createElement('summary'); summary.textContent = t('อ่านเนื้อหาเต็ม');
      const preview = document.createElement('pre'); preview.textContent = skill.content;
      details.append(summary, preview);
      const add = document.createElement('button'); add.className = 'footer-btn'; add.textContent = t(ids.has(skill.id) ? 'เพิ่มแล้ว' : 'เพิ่มเข้าคลัง'); add.disabled = busy || ids.has(skill.id);
      add.addEventListener('click', async () => {
        if (busy) return;
        busy = true;
        error.hidden = true;
        list.querySelectorAll('button').forEach(button => { button.disabled = true; });
        try {
          // Recheck on each click; do not replace the user's edited starter.
          const current = await window.SkilltapeStorage.getSkills();
          if (!current.some(s => s.id === skill.id)) await window.SkilltapeStorage.importJSON(JSON.stringify({skills:[skill]}), {mode:'merge'});
          await refresh(); showToast(t('เพิ่มแล้ว'));
        } catch { error.textContent = t('บันทึกไม่สำเร็จ'); error.hidden = false; }
        finally { busy = false; renderStarters().catch(() => showToast(t('โหลด Skills ไม่สำเร็จ'))); }
      });
      item.append(name, description, adaptation, source, details, add); list.appendChild(item);
    }
  }
  document.getElementById('starterBtn').addEventListener('click', async () => {
    try {
      if (!catalog) {
        const response = await fetch(chrome.runtime.getURL('data/starter-skills.json'));
        if (!response.ok) throw new Error('catalog unavailable');
        catalog = await response.json();
      }
      error.hidden = true;
      await renderStarters(); if (!dialog.open) dialog.showModal();
    } catch { showToast(t('โหลด Skills ไม่สำเร็จ')); }
  });
  document.getElementById('closeStarterBtn').addEventListener('click', () => dialog.close());
  document.addEventListener('languagechange', () => {
    if (catalog && dialog.open) renderStarters().catch(() => showToast(t('โหลด Skills ไม่สำเร็จ')));
  });
})();
