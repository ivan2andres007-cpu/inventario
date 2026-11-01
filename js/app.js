/**
 * app.js - Lógica de Interfaz Profesional y Minimalista con Buscador de Alumnos
 */

document.addEventListener('DOMContentLoaded', () => {
  // Estado local
  let loanUnderReturn = null;
  let returnChoice = 'same'; // 'same' | 'other'
  let selectedBorrowerName = null;
  let activeLoansFilterQuery = '';
  const selectedToolNames = new Set();

  // --- Toast Discreto HUD ---
  function showToast(message) {
    const toast = document.getElementById('hud-toast');
    const toastText = document.getElementById('hud-toast-text');
    if (!toast || !toastText) return;

    toastText.textContent = message;
    toast.style.display = 'flex';
    toast.style.animation = 'none';
    toast.offsetHeight; // Forzar reflow
    toast.style.animation = 'slideDownToast 0.25s cubic-bezier(0.16, 1, 0.3, 1)';

    setTimeout(() => {
      toast.style.display = 'none';
    }, 2800);
  }

  // --- Iniciales para el Avatar ---
  function getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // --- Formateador de Fechas Amigable ---
  function formatHumanTime(dateStr) {
    if (!dateStr) return '';
    return dateStr;
  }

  // --- Control Segmentado (Tabs) ---
  const navPills = document.querySelectorAll('.nav-pill');
  const sections = {
    active: document.getElementById('section-view-active'),
    loan: document.getElementById('section-view-loan'),
    tools: document.getElementById('section-view-tools'),
    history: document.getElementById('section-view-history')
  };

  function switchTab(tabKey) {
    navPills.forEach(pill => {
      if (pill.getAttribute('data-tab') === tabKey) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    Object.keys(sections).forEach(key => {
      if (sections[key]) {
        sections[key].style.display = (key === tabKey) ? 'block' : 'none';
      }
    });

    if (tabKey === 'active') renderActiveLoans();
    if (tabKey === 'loan') {
      populateStudentDatalist();
      renderLoanAvailableTags();
      if (!selectedBorrowerName) {
        renderStudentDropdown(inputSearchStudent ? inputSearchStudent.value : '');
      }
    }
    if (tabKey === 'tools') renderToolsCatalog();
    if (tabKey === 'history') renderHistoryLog();
    updateCounterBadge();
  }

  navPills.forEach(pill => {
    pill.addEventListener('click', () => {
      switchTab(pill.getAttribute('data-tab'));
    });
  });

  function updateCounterBadge() {
    const badge = document.getElementById('tab-counter-active');
    if (badge) {
      badge.textContent = window.db.getActiveLoans().length;
    }
  }

  // ===============================================================
  // 1. RENDERIZAR PRÉSTAMOS ACTIVOS (Agrupados por Persona)
  // ===============================================================
  const inputFilterLoans = document.getElementById('input-filter-loans');
  const btnClearLoansFilter = document.getElementById('btn-clear-loans-filter');

  inputFilterLoans?.addEventListener('input', (e) => {
    activeLoansFilterQuery = e.target.value.trim().toLowerCase();
    if (btnClearLoansFilter) {
      btnClearLoansFilter.style.display = activeLoansFilterQuery ? 'block' : 'none';
    }
    renderActiveLoans();
  });

  btnClearLoansFilter?.addEventListener('click', () => {
    inputFilterLoans.value = '';
    activeLoansFilterQuery = '';
    btnClearLoansFilter.style.display = 'none';
    inputFilterLoans.focus();
    renderActiveLoans();
  });

  function renderActiveLoans() {
    const container = document.getElementById('container-active-loans');
    if (!container) return;

    let activeLoans = window.db.getActiveLoans();
    updateCounterBadge();

    // Filtro en vivo si el usuario busca por nombre o herramienta (sin importar acentos)
    if (activeLoansFilterQuery) {
      const q = window.db.cleanStr(activeLoansFilterQuery);
      activeLoans = activeLoans.filter(l => 
        window.db.cleanStr(l.borrower).includes(q) || 
        window.db.cleanStr(l.toolName).includes(q)
      );
    }

    if (activeLoans.length === 0) {
      container.innerHTML = `
        <div class="empty-state-notice">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--bg-subtle); border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: center; margin: 0 auto; color: var(--accent-emerald);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h4>${activeLoansFilterQuery ? 'No hay coincidencias' : 'Todas las herramientas están en pañol'}</h4>
          <p>${activeLoansFilterQuery ? 'Prueba con otro nombre o herramienta' : 'No hay herramientas prestadas en este momento.'}</p>
        </div>
      `;
      return;
    }

    // Agrupar por persona que las llevó
    const groups = {};
    activeLoans.forEach(loan => {
      if (!groups[loan.borrower]) {
        groups[loan.borrower] = [];
      }
      groups[loan.borrower].push(loan);
    });

    container.innerHTML = Object.keys(groups).map(borrower => {
      const items = groups[borrower];
      const count = items.length;
      const initials = getInitials(borrower);

      return `
        <div class="person-group">
          <!-- Barra superior de la persona -->
          <div class="person-bar">
            <div class="person-info">
              <div class="avatar-badge">${initials}</div>
              <div class="person-meta">
                <h3>${borrower}</h3>
                <span>${count} ${count === 1 ? 'herramienta en uso' : 'herramientas en uso'}</span>
              </div>
            </div>
            <span class="badge-tag">Activo</span>
          </div>

          <!-- Lista de herramientas que tiene esa persona -->
          <div class="tools-stack">
            ${items.map(loan => `
              <div class="tool-row">
                <div class="tool-detail">
                  <div class="tool-title">
                    <svg class="tool-icon-mini" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                    </svg>
                    <span>${loan.toolName}</span>
                  </div>
                  <span class="tool-timestamp">Retirada: ${formatHumanTime(loan.loanDate)}</span>
                </div>
                <button class="btn-action-return" data-action="return-loan" data-loan-id="${loan.id}">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 14 4 9 9 4"></polyline>
                    <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                  </svg>
                  <span>Devolver</span>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  // ===============================================================
  // 2. BUSCADOR DE ALUMNOS (SELECCIÓN RÁPIDA DE LA LISTA OFICIAL)
  // ===============================================================
  const inputSearchStudent = document.getElementById('input-search-student');
  const dropdownStudents = document.getElementById('dropdown-students-list');
  const bannerSelected = document.getElementById('banner-selected-student');
  const bannerStudentName = document.getElementById('banner-student-name');
  const bannerStudentAvatar = document.getElementById('banner-student-avatar');
  const btnRemoveSelected = document.getElementById('btn-remove-selected-student');
  const btnClearSearch = document.getElementById('btn-clear-student-search');
  const studentSearchWrapper = document.getElementById('student-search-wrapper');

  // Llenar el datalist nativo para compatibilidad con teclados virtuales de Android
  function populateStudentDatalist() {
    const datalist = document.getElementById('datalist-official-students');
    if (!datalist) return;
    const students = window.db.getStudents();
    datalist.innerHTML = students.map(s => `<option value="${s}"></option>`).join('');
  }

  function renderStudentDropdown(query = '') {
    if (!dropdownStudents) return;
    const cleanQ = (query || '').trim();
    const results = window.db.searchStudents(cleanQ);
    const totalStudents = window.db.getStudents().length;

    let html = '';

    // Encabezado con conteo
    if (!cleanQ) {
      html += `
        <div class="student-dropdown-count">
          <span>${totalStudents} Alumnos Oficiales</span>
          <span>Toca uno para elegir</span>
        </div>
      `;
    } else {
      html += `
        <div class="student-dropdown-count">
          <span>Coincidencias: ${results.length}</span>
          <span>Toca para elegir</span>
        </div>
      `;
    }

    if (results.length === 0) {
      html += `
        <div style="padding: 12px 14px; font-size: 13px; color: var(--text-tertiary); text-align: center;">
          No se encontró "${cleanQ}" en la lista.
        </div>
        <div class="student-dropdown-item student-dropdown-custom" data-student-pick="${cleanQ.toUpperCase()}">
          <div class="student-dropdown-avatar">➕</div>
          <span class="student-dropdown-name">Usar "${cleanQ.toUpperCase()}" (Nuevo)</span>
        </div>
      `;
    } else {
      html += results.map(name => `
        <div class="student-dropdown-item" data-student-pick="${name}">
          <div class="student-dropdown-avatar">${getInitials(name)}</div>
          <span class="student-dropdown-name">${name}</span>
        </div>
      `).join('');

      // Opción para registrar nombre nuevo si lo escrito no coincide exactamente
      const exactMatch = results.some(r => window.db.cleanStr(r) === window.db.cleanStr(cleanQ));
      if (cleanQ && !exactMatch && cleanQ.length >= 2) {
        html += `
          <div class="student-dropdown-item student-dropdown-custom" data-student-pick="${cleanQ.toUpperCase()}">
            <div class="student-dropdown-avatar">➕</div>
            <span class="student-dropdown-name">Usar "${cleanQ.toUpperCase()}" (Nuevo)</span>
          </div>
        `;
      }
    }

    dropdownStudents.innerHTML = html;
  }

  function selectBorrower(name) {
    if (!name || !name.trim()) return;
    selectedBorrowerName = name.trim().toUpperCase();
    bannerStudentName.textContent = selectedBorrowerName;
    bannerStudentAvatar.textContent = getInitials(selectedBorrowerName);
    bannerSelected.classList.add('visible');
    studentSearchWrapper.style.display = 'none';
  }

  function unselectBorrower() {
    selectedBorrowerName = null;
    bannerSelected.classList.remove('visible');
    studentSearchWrapper.style.display = 'block';
    if (inputSearchStudent) {
      inputSearchStudent.value = '';
      btnClearSearch.style.display = 'none';
    }
    renderStudentDropdown('');
  }

  // Toque seguro para celulares de gama baja (pointerdown + click sin retraso)
  function handleStudentSelection(e) {
    const item = e.target.closest('[data-student-pick]');
    if (!item) return;
    e.preventDefault();
    const name = item.getAttribute('data-student-pick');
    selectBorrower(name);
  }

  dropdownStudents?.addEventListener('pointerdown', handleStudentSelection);
  dropdownStudents?.addEventListener('click', handleStudentSelection);

  inputSearchStudent?.addEventListener('input', (e) => {
    const val = e.target.value;
    btnClearSearch.style.display = val ? 'block' : 'none';

    // Si seleccionó o escribió exactamente un nombre completo de la lista
    const exact = window.db.getStudents().find(s => s.toUpperCase() === val.trim().toUpperCase());
    if (exact) {
      selectBorrower(exact);
      return;
    }

    renderStudentDropdown(val);
  });

  inputSearchStudent?.addEventListener('focus', () => {
    renderStudentDropdown(inputSearchStudent.value);
  });

  btnClearSearch?.addEventListener('click', () => {
    inputSearchStudent.value = '';
    btnClearSearch.style.display = 'none';
    renderStudentDropdown('');
    inputSearchStudent.focus();
  });

  btnRemoveSelected?.addEventListener('click', () => {
    unselectBorrower();
  });

  // ===============================================================
  // 3. SELECCIÓN DE HERRAMIENTAS Y CONFIRMAR PRÉSTAMO
  // ===============================================================
  function renderLoanAvailableTags() {
    const grid = document.getElementById('grid-available-tools');
    const badge = document.getElementById('selected-tags-badge');
    if (!grid) return;

    const allTools = window.db.getTools();
    selectedToolNames.clear();
    if (badge) badge.textContent = '0 seleccionadas';

    if (allTools.length === 0) {
      grid.innerHTML = '<span style="font-size: 13px; color: var(--text-tertiary);">No hay herramientas registradas. Puedes agregarlas en la pestaña Catálogo.</span>';
      return;
    }

    grid.innerHTML = allTools.map(name => {
      const isAvailable = window.db.isToolAvailable(name);
      if (!isAvailable) {
        const holder = window.db.getToolHolder(name);
        return `
          <button type="button" class="tag-select-btn busy" title="Prestada a ${holder}">
            <span>${name}</span>
            <span style="font-size: 11px; opacity: 0.7;">(con ${holder})</span>
          </button>
        `;
      }
      return `
        <button type="button" class="tag-select-btn" data-tool-pick="${name}">
          <span>${name}</span>
        </button>
      `;
    }).join('');
  }

  // Selección táctil de tags de herramientas
  const tagsGrid = document.getElementById('grid-available-tools');
  tagsGrid?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tool-pick]');
    if (!btn) return;

    const toolName = btn.getAttribute('data-tool-pick');
    if (selectedToolNames.has(toolName)) {
      selectedToolNames.delete(toolName);
      btn.classList.remove('selected');
    } else {
      selectedToolNames.add(toolName);
      btn.classList.add('selected');
    }

    const badge = document.getElementById('selected-tags-badge');
    if (badge) {
      const count = selectedToolNames.size;
      badge.textContent = `${count} ${count === 1 ? 'seleccionada' : 'seleccionadas'}`;
      badge.style.color = count > 0 ? 'var(--accent-blue)' : 'var(--text-tertiary)';
    }
  });

  // Confirmar Préstamo
  document.getElementById('btn-confirm-loan')?.addEventListener('click', () => {
    const customToolInput = document.getElementById('input-custom-tool');

    // Nombre: o el alumno seleccionado en el buscador o lo que escribió directamente
    const borrower = selectedBorrowerName || (inputSearchStudent ? inputSearchStudent.value.trim().toUpperCase() : '');

    if (!borrower) {
      alert('Por favor busca y selecciona el alumno que se lleva la herramienta.');
      if (inputSearchStudent) {
        inputSearchStudent.focus();
        renderStudentDropdown('');
      }
      return;
    }

    const toolsList = Array.from(selectedToolNames);
    const customTool = customToolInput ? customToolInput.value.trim() : '';
    if (customTool) {
      toolsList.push(customTool);
    }

    if (toolsList.length === 0) {
      alert('Toca al menos una herramienta disponible o escribe una nueva.');
      return;
    }

    try {
      window.db.registerLoan(borrower, toolsList);
      showToast(`Préstamo registrado a ${borrower}`);

      // Resetear campos
      unselectBorrower();
      if (customToolInput) customToolInput.value = '';
      selectedToolNames.clear();

      // Cambiar de inmediato a la pestaña de prestadas
      switchTab('active');
    } catch (err) {
      alert(err.message);
    }
  });

  // ===============================================================
  // 4. CATÁLOGO DE HERRAMIENTAS (AGREGAR AUTOMÁTICO)
  // ===============================================================
  const formAddTool = document.getElementById('form-quick-add-tool');
  const inputNewTool = document.getElementById('input-new-tool-name');

  formAddTool?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = inputNewTool.value.trim();
    if (!name) return;

    try {
      window.db.addTool(name);
      showToast(`"${name}" guardada en el catálogo`);
      inputNewTool.value = '';
      renderToolsCatalog();
    } catch (err) {
      alert(err.message);
    }
  });

  function renderToolsCatalog() {
    const container = document.getElementById('container-tools-catalog');
    const countLabel = document.getElementById('label-tools-count');
    if (!container) return;

    const allTools = window.db.getTools();
    if (countLabel) countLabel.textContent = `(${allTools.length})`;

    if (allTools.length === 0) {
      container.innerHTML = '<div class="empty-state-notice"><p>No hay herramientas registradas aún.</p></div>';
      return;
    }

    container.innerHTML = allTools.map(name => {
      const isAvailable = window.db.isToolAvailable(name);
      const holder = window.db.getToolHolder(name);

      return `
        <div class="tool-record-card">
          <div class="tool-record-info">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-tertiary);">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            <div>
              <span class="tool-record-name">${name}</span>
              <div style="margin-top: 2px;">
                ${isAvailable 
                  ? '<span class="status-badge-clean available">Disponible</span>' 
                  : `<span class="status-badge-clean busy">En poder de ${holder}</span>`}
              </div>
            </div>
          </div>

          <div>
            ${isAvailable ? `
              <button class="btn-trash" data-action="delete-catalog-tool" data-tool-name="${name}" title="Eliminar del catálogo" aria-label="Eliminar">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // Eliminar herramienta del catálogo
  document.getElementById('container-tools-catalog')?.addEventListener('click', (e) => {
    const trashBtn = e.target.closest('[data-action="delete-catalog-tool"]');
    if (!trashBtn) return;

    const name = trashBtn.getAttribute('data-tool-name');
    if (confirm(`¿Deseas eliminar "${name}" del catálogo?`)) {
      window.db.deleteTool(name);
      showToast(`Herramienta eliminada`);
      renderToolsCatalog();
    }
  });

  // ===============================================================
  // 5. BOTTOM SHEET: DEVOLUCIÓN DE HERRAMIENTA (MISMA U OTRA PERSONA)
  // ===============================================================
  const sheetModal = document.getElementById('sheet-return-modal');
  const optionSame = document.getElementById('option-same-borrower');
  const optionOther = document.getElementById('option-other-borrower');
  const otherBox = document.getElementById('sheet-other-person-box');
  const inputOther = document.getElementById('input-other-name');
  const dropdownOther = document.getElementById('dropdown-other-students-list');
  const btnClearOther = document.getElementById('btn-clear-other-search');
  const labelSameName = document.getElementById('label-same-name');

  // Abrir Bottom Sheet de devolución
  document.addEventListener('click', (e) => {
    const returnBtn = e.target.closest('[data-action="return-loan"]');
    if (!returnBtn) return;

    const loanId = parseInt(returnBtn.getAttribute('data-loan-id'));
    const loan = window.db.getLoans().find(l => l.id === loanId);
    if (!loan) return;

    loanUnderReturn = loan;

    document.getElementById('sheet-tool-title').textContent = `Devolver: ${loan.toolName}`;
    document.getElementById('sheet-borrower-desc').textContent = `Se la llevó: ${loan.borrower} (${loan.loanDate})`;
    labelSameName.textContent = loan.borrower;

    // Resetear a "La misma persona"
    returnChoice = 'same';
    optionSame.classList.add('active');
    optionOther.classList.remove('active');
    otherBox.style.display = 'none';
    inputOther.value = '';
    dropdownOther.classList.remove('open');

    sheetModal.classList.add('open');
  });

  // Elección: La misma persona
  optionSame?.addEventListener('click', () => {
    returnChoice = 'same';
    optionSame.classList.add('active');
    optionOther.classList.remove('active');
    otherBox.style.display = 'none';
    dropdownOther.classList.remove('open');
  });

  // Elección: Otra persona
  function renderOtherStudentDropdown(query = '') {
    if (!dropdownOther) return;
    const cleanQ = (query || '').trim();
    const results = window.db.searchStudents(cleanQ);

    let html = '';
    if (results.length === 0) {
      html += `
        <div style="padding: 10px 14px; font-size: 13px; color: var(--text-tertiary); text-align: center;">
          No se encontró "${cleanQ}" en la lista.
        </div>
        <div class="student-dropdown-item student-dropdown-custom" data-other-pick="${cleanQ.toUpperCase()}">
          <div class="student-dropdown-avatar">➕</div>
          <span class="student-dropdown-name">Usar "${cleanQ.toUpperCase()}" (Nuevo)</span>
        </div>
      `;
    } else {
      html += results.map(name => `
        <div class="student-dropdown-item" data-other-pick="${name}">
          <div class="student-dropdown-avatar">${getInitials(name)}</div>
          <span class="student-dropdown-name">${name}</span>
        </div>
      `).join('');

      const exactMatch = results.some(r => window.db.cleanStr(r) === window.db.cleanStr(cleanQ));
      if (cleanQ && !exactMatch && cleanQ.length >= 2) {
        html += `
          <div class="student-dropdown-item student-dropdown-custom" data-other-pick="${cleanQ.toUpperCase()}">
            <div class="student-dropdown-avatar">➕</div>
            <span class="student-dropdown-name">Usar "${cleanQ.toUpperCase()}" (Nuevo)</span>
          </div>
        `;
      }
    }

    dropdownOther.innerHTML = html;
  }

  function handleOtherStudentSelection(e) {
    const item = e.target.closest('[data-other-pick]');
    if (!item) return;
    e.preventDefault();
    const name = item.getAttribute('data-other-pick');
    inputOther.value = name;
  }

  dropdownOther?.addEventListener('pointerdown', handleOtherStudentSelection);
  dropdownOther?.addEventListener('click', handleOtherStudentSelection);

  optionOther?.addEventListener('click', () => {
    returnChoice = 'other';
    optionOther.classList.add('active');
    optionSame.classList.remove('active');
    otherBox.style.display = 'block';
    renderOtherStudentDropdown('');
  });

  inputOther?.addEventListener('focus', () => {
    renderOtherStudentDropdown(inputOther.value);
  });

  inputOther?.addEventListener('input', (e) => {
    const val = e.target.value;
    if (btnClearOther) btnClearOther.style.display = val ? 'block' : 'none';
    renderOtherStudentDropdown(val);
  });

  btnClearOther?.addEventListener('click', () => {
    inputOther.value = '';
    btnClearOther.style.display = 'none';
    renderOtherStudentDropdown('');
    inputOther.focus();
  });

  // Cancelar Devolución
  document.getElementById('btn-cancel-return-sheet')?.addEventListener('click', () => {
    sheetModal.classList.remove('open');
    loanUnderReturn = null;
  });

  // Confirmar Devolución
  document.getElementById('btn-submit-return-sheet')?.addEventListener('click', () => {
    if (!loanUnderReturn) return;

    let returner = '';
    if (returnChoice === 'same') {
      returner = loanUnderReturn.borrower;
    } else {
      returner = inputOther.value.trim().toUpperCase();
      if (!returner) {
        alert('Por favor busca o escribe el nombre de la persona que entrega la herramienta.');
        inputOther.focus();
        return;
      }
    }

    try {
      window.db.registerReturn(loanUnderReturn.id, returner);
      sheetModal.classList.remove('open');
      showToast(`${loanUnderReturn.toolName} devuelta por ${returner}`);
      loanUnderReturn = null;
      renderActiveLoans();
    } catch (err) {
      alert(err.message);
    }
  });

  // Cerrar menús desplegables al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#student-search-wrapper')) {
      dropdownStudents?.classList.remove('open');
    }
    if (!e.target.closest('#sheet-other-person-box')) {
      dropdownOther?.classList.remove('open');
    }
  });

  // ===============================================================
  // 6. HISTORIAL COMPLETO Y EXCEL
  // ===============================================================
  function renderHistoryLog() {
    const container = document.getElementById('container-full-history');
    if (!container) return;

    const loans = window.db.getLoans();
    if (loans.length === 0) {
      container.innerHTML = '<div class="empty-state-notice"><p>Sin movimientos registrados todavía.</p></div>';
      return;
    }

    container.innerHTML = loans.map(l => `
      <div class="log-row">
        <div class="log-row-header">
          <span>${l.toolName}</span>
          <span style="font-size: 12px; font-weight: 700; color: ${l.returned ? 'var(--accent-emerald)' : 'var(--accent-amber)'}">
            ${l.returned ? 'Devuelta' : 'En uso'}
          </span>
        </div>
        <div class="log-row-details">
          <div>Se la llevó: <strong style="color: var(--text-main);">${l.borrower}</strong> • ${l.loanDate}</div>
          ${l.returned ? `<div>Devuelta por: <strong style="color: var(--text-main);">${l.returner}</strong> • ${l.returnDate}</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  // Descarga de Excel
  function downloadExcel() {
    try {
      const filename = window.schoolExcel.exportToExcel();
      showToast(`Descargado: ${filename}`);
    } catch (e) {
      alert('Error al generar Excel: ' + e.message);
    }
  }

  document.getElementById('btn-download-excel-file')?.addEventListener('click', downloadExcel);
  document.getElementById('btn-header-export-quick')?.addEventListener('click', downloadExcel);

  // --- Modo Oscuro / Claro ---
  const themeToggle = document.getElementById('btn-theme-toggle');
  themeToggle?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);

    themeToggle.innerHTML = next === 'dark' ? `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    ` : `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
  });

  // --- Service Worker & Instalación PWA ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        console.log('[SW] Service Worker activo en:', reg.scope);
      }).catch((err) => {
        console.warn('[SW] No se pudo registrar:', err);
      });
    });
  }

  let deferredInstallPrompt = null;
  const btnInstallApp = document.getElementById('btn-install-app');
  const sheetInstallModal = document.getElementById('sheet-install-modal');
  const btnCloseInstallSheet = document.getElementById('btn-close-install-sheet');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (btnInstallApp) {
      btnInstallApp.classList.add('visible');
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    if (btnInstallApp) {
      btnInstallApp.style.display = 'none';
    }
    showToast('¡App instalada con éxito en tu dispositivo!');
  });

  if (btnInstallApp) {
    btnInstallApp.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          showToast('Instalando aplicación...');
        }
        deferredInstallPrompt = null;
      } else {
        // En iOS, Safari o si ya se abrió directamente, mostrar guía
        if (sheetInstallModal) {
          sheetInstallModal.classList.add('open');
        }
      }
    });
  }

  if (btnCloseInstallSheet) {
    btnCloseInstallSheet.addEventListener('click', () => {
      sheetInstallModal?.classList.remove('open');
    });
  }

  sheetInstallModal?.addEventListener('click', (e) => {
    if (e.target === sheetInstallModal) {
      sheetInstallModal.classList.remove('open');
    }
  });

  // Inicialización de la lista de alumnos
  populateStudentDatalist();

  // Render inicial
  switchTab('active');
});

