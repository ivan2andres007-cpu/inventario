/**
 * db.js - Almacenamiento Simple para el Colegio
 * Guarda herramientas, préstamos y devoluciones en localStorage de forma automática.
 */

const STORAGE_TOOLS = 'colegio_herramientas';
const STORAGE_LOANS = 'colegio_prestamos';

// Herramientas iniciales de ejemplo comunes de colegio/taller
const DEFAULT_TOOLS = [
  'Martillo',
  'Destornillador Phillips',
  'Destornillador Plano',
  'Pinza Universal',
  'Tester / Multímetro',
  'Soldador de Estaño (Cautín)',
  'Cinta Métrica',
  'Tijera de Hojalata',
  'Regla Metálica',
  'Pistola de Silicona'
];

// Préstamos iniciales de ejemplo
const DEFAULT_LOANS = [
  {
    id: 1,
    toolName: 'Martillo',
    borrower: 'Lucas Martínez',
    loanDate: '01/11/2026, 09:15',
    returned: false,
    returner: null,
    returnDate: null
  },
  {
    id: 2,
    toolName: 'Tester / Multímetro',
    borrower: 'Lucas Martínez',
    loanDate: '01/11/2026, 09:16',
    returned: false,
    returner: null,
    returnDate: null
  },
  {
    id: 3,
    toolName: 'Destornillador Phillips',
    borrower: 'Sofía Romero',
    loanDate: '01/11/2026, 10:05',
    returned: true,
    returner: 'Sofía Romero',
    returnDate: '01/11/2026, 11:30'
  }
];

class SimpleDB {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_TOOLS)) {
      localStorage.setItem(STORAGE_TOOLS, JSON.stringify(DEFAULT_TOOLS));
    }
    if (!localStorage.getItem(STORAGE_LOANS)) {
      localStorage.setItem(STORAGE_LOANS, JSON.stringify(DEFAULT_LOANS));
    }
  }

  // --- Herramientas ---
  getTools() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_TOOLS)) || [];
    } catch (e) {
      return DEFAULT_TOOLS;
    }
  }

  addTool(name) {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const tools = this.getTools();
    // Evitar duplicados exactos
    if (tools.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`La herramienta "${trimmed}" ya está en la lista.`);
    }
    tools.unshift(trimmed);
    localStorage.setItem(STORAGE_TOOLS, JSON.stringify(tools));
    return true;
  }

  deleteTool(name) {
    const tools = this.getTools().filter(t => t.toLowerCase() !== name.toLowerCase());
    localStorage.setItem(STORAGE_TOOLS, JSON.stringify(tools));
  }

  // --- Préstamos ---
  getLoans() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_LOANS)) || [];
    } catch (e) {
      return DEFAULT_LOANS;
    }
  }

  getActiveLoans() {
    return this.getLoans().filter(l => !l.returned);
  }

  getReturnedLoans() {
    return this.getLoans().filter(l => l.returned);
  }

  // Registra que una persona se llevó una o más herramientas
  registerLoan(borrowerName, toolNames) {
    const borrower = borrowerName.trim();
    if (!borrower) throw new Error('Debes escribir el nombre de la persona que se lleva la herramienta.');
    if (!toolNames || toolNames.length === 0) throw new Error('Debes seleccionar o escribir al menos una herramienta.');

    const loans = this.getLoans();
    const active = this.getActiveLoans();
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const fullDate = `${dateFormatted}, ${timeFormatted}`;

    const newEntries = [];

    toolNames.forEach(tName => {
      const name = tName.trim();
      // Verificar si ya está prestada
      const alreadyTaken = active.find(l => l.toolName.toLowerCase() === name.toLowerCase());
      if (alreadyTaken) {
        throw new Error(`La herramienta "${name}" ya se la llevó ${alreadyTaken.borrower} y aún no la devolvió.`);
      }

      // Si la herramienta no estaba en la lista de herramientas, guardarla automáticamente
      const allTools = this.getTools();
      if (!allTools.some(t => t.toLowerCase() === name.toLowerCase())) {
        allTools.push(name);
        localStorage.setItem(STORAGE_TOOLS, JSON.stringify(allTools));
      }

      const nextId = loans.length > 0 ? Math.max(...loans.map(l => l.id || 0)) + 1 : 1;
      const loanObj = {
        id: nextId + newEntries.length,
        toolName: name,
        borrower: borrower,
        loanDate: fullDate,
        returned: false,
        returner: null,
        returnDate: null
      };
      newEntries.push(loanObj);
    });

    loans.unshift(...newEntries);
    localStorage.setItem(STORAGE_LOANS, JSON.stringify(loans));
    return newEntries;
  }

  // Registra la devolución de una herramienta
  registerReturn(loanId, returnerName) {
    const returner = returnerName ? returnerName.trim() : '';
    if (!returner) throw new Error('Debes indicar quién devuelve la herramienta.');

    const loans = this.getLoans();
    const loan = loans.find(l => l.id === loanId);
    if (!loan) throw new Error('Préstamo no encontrado.');
    if (loan.returned) throw new Error('Esta herramienta ya figura como devuelta.');

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const fullDate = `${dateFormatted}, ${timeFormatted}`;

    loan.returned = true;
    loan.returner = returner;
    loan.returnDate = fullDate;

    localStorage.setItem(STORAGE_LOANS, JSON.stringify(loans));
    return loan;
  }

  // Comprueba si una herramienta está disponible o prestada
  isToolAvailable(toolName) {
    const active = this.getActiveLoans();
    return !active.some(l => l.toolName.toLowerCase() === toolName.toLowerCase());
  }

  // Quién tiene la herramienta actualmente
  getToolHolder(toolName) {
    const active = this.getActiveLoans();
    const loan = active.find(l => l.toolName.toLowerCase() === toolName.toLowerCase());
    return loan ? loan.borrower : null;
  }

  resetData() {
    localStorage.setItem(STORAGE_TOOLS, JSON.stringify(DEFAULT_TOOLS));
    localStorage.setItem(STORAGE_LOANS, JSON.stringify(DEFAULT_LOANS));
  }
}

window.db = new SimpleDB();
