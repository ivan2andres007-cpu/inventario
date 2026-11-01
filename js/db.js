/**
 * db.js - Almacenamiento Simple para el Colegio
 * Guarda herramientas, lista oficial de alumnos, préstamos y devoluciones en localStorage.
 */

const STORAGE_TOOLS = 'colegio_herramientas';
const STORAGE_LOANS = 'colegio_prestamos';
const STORAGE_STUDENTS = 'colegio_alumnos';

// Lista Oficial de Alumnos / Personal del Colegio proporcionada
const OFFICIAL_STUDENTS = [
  "ALEX ACOSTA",
  "JOEL BAEL",
  "ISAIAS BENITEZ",
  "JUAN CABRERA",
  "SANTINO CARDOZO",
  "ANGEL ROLON",
  "RODNEY COLMAN",
  "FACUNDO ENCINA",
  "BENJAMIN GARRIDO",
  "LUCAS GONZALEZ",
  "FRANCO MASI",
  "JENNIFER MAZO",
  "GERARDO MENDIETA",
  "MARIA MENDOZA",
  "EVER MENDOZA",
  "YERUTI MORINIGO",
  "MATEO ORIHUELA",
  "ESTEBAN ORREGO",
  "VICTORIA ORUE",
  "ENZO PACUÁ",
  "ISAIAS PEREZ",
  "JUAN ROJAS",
  "MARINA ROSELLON",
  "GUSTAVO RUIZ",
  "KAREN RUIZ",
  "JOSHIAS SERVIN",
  "JORGE TORRES",
  "MATIAS VEGA"
];

// Herramientas iniciales de taller escolar
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

// Préstamos iniciales con alumnos de la lista oficial
const DEFAULT_LOANS = [
  {
    id: 1,
    toolName: 'Martillo',
    borrower: 'ISAIAS BENITEZ',
    loanDate: '01/11/2026, 09:15',
    returned: false,
    returner: null,
    returnDate: null
  },
  {
    id: 2,
    toolName: 'Tester / Multímetro',
    borrower: 'ISAIAS BENITEZ',
    loanDate: '01/11/2026, 09:16',
    returned: false,
    returner: null,
    returnDate: null
  },
  {
    id: 3,
    toolName: 'Soldador de Estaño (Cautín)',
    borrower: 'SANTINO CARDOZO',
    loanDate: '01/11/2026, 09:30',
    returned: false,
    returner: null,
    returnDate: null
  },
  {
    id: 4,
    toolName: 'Destornillador Phillips',
    borrower: 'MARIA MENDOZA',
    loanDate: '01/11/2026, 08:30',
    returned: true,
    returner: 'MARIA MENDOZA',
    returnDate: '01/11/2026, 10:15'
  }
];

class SimpleDB {
  constructor() {
    this.init();
  }

  init() {
    // Asegurar herramientas
    if (!localStorage.getItem(STORAGE_TOOLS)) {
      localStorage.setItem(STORAGE_TOOLS, JSON.stringify(DEFAULT_TOOLS));
    }

    // Asegurar lista oficial de alumnos (siempre combinada y ordenada alfabéticamente)
    let existingStudents = [];
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_STUDENTS));
      if (Array.isArray(stored)) {
        existingStudents = stored;
      }
    } catch (e) {
      existingStudents = [];
    }

    const merged = Array.from(new Set([...OFFICIAL_STUDENTS, ...existingStudents.filter(Boolean)]));
    merged.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    localStorage.setItem(STORAGE_STUDENTS, JSON.stringify(merged));

    // Asegurar préstamos iniciales
    if (!localStorage.getItem(STORAGE_LOANS)) {
      localStorage.setItem(STORAGE_LOANS, JSON.stringify(DEFAULT_LOANS));
    }
  }

  // --- Normalizador de Texto Infalible (Compatible con Android Go / Samsung A03 Core) ---
  cleanStr(s) {
    if (!s) return '';
    let res = String(s).toLowerCase();
    try {
      res = res.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    } catch (e) {
      // Fallback si la biblioteca ICU de Android Go no tiene normalize completo
    }
    return res
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .trim();
  }

  // --- Alumnos / Personal ---
  getStudents() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_STUDENTS));
      if (Array.isArray(stored) && stored.length > 0) {
        return stored;
      }
      return OFFICIAL_STUDENTS;
    } catch (e) {
      return OFFICIAL_STUDENTS;
    }
  }

  searchStudents(query) {
    const list = this.getStudents();
    if (!query || !query.trim()) return list;

    const qClean = this.cleanStr(query);
    const words = qClean.split(/\s+/).filter(Boolean);
    if (words.length === 0) return list;

    return list.filter(name => {
      const nameClean = this.cleanStr(name);
      return words.every(w => nameClean.includes(w));
    });
  }

  addStudent(name) {
    const trimmed = name.trim().toUpperCase();
    if (!trimmed) return false;
    const students = this.getStudents();
    if (!students.some(s => s.toUpperCase() === trimmed)) {
      students.push(trimmed);
      students.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
      localStorage.setItem(STORAGE_STUDENTS, JSON.stringify(students));
    }
    return true;
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

  registerLoan(borrowerName, toolNames) {
    const borrower = borrowerName.trim().toUpperCase();
    if (!borrower) throw new Error('Debes seleccionar o escribir el nombre de la persona que se lleva la herramienta.');
    if (!toolNames || toolNames.length === 0) throw new Error('Debes seleccionar o escribir al menos una herramienta.');

    // Guardar al alumno si es nuevo
    this.addStudent(borrower);

    const loans = this.getLoans();
    const active = this.getActiveLoans();
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const fullDate = `${dateFormatted}, ${timeFormatted}`;

    const newEntries = [];

    toolNames.forEach(tName => {
      const name = tName.trim();
      const alreadyTaken = active.find(l => l.toolName.toLowerCase() === name.toLowerCase());
      if (alreadyTaken) {
        throw new Error(`La herramienta "${name}" ya se la llevó ${alreadyTaken.borrower} y aún no la devolvió.`);
      }

      // Si la herramienta no estaba en el inventario, se guarda automáticamente
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

  registerReturn(loanId, returnerName) {
    const returner = returnerName ? returnerName.trim().toUpperCase() : '';
    if (!returner) throw new Error('Debes indicar quién devuelve la herramienta.');

    // Guardar alumno si es nuevo
    this.addStudent(returner);

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

  isToolAvailable(toolName) {
    const active = this.getActiveLoans();
    return !active.some(l => l.toolName.toLowerCase() === toolName.toLowerCase());
  }

  getToolHolder(toolName) {
    const active = this.getActiveLoans();
    const loan = active.find(l => l.toolName.toLowerCase() === toolName.toLowerCase());
    return loan ? loan.borrower : null;
  }
}

window.db = new SimpleDB();
