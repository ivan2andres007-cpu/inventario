/**
 * excel.js - Exportador Simple a Excel (.xlsx) con SheetJS
 * Diseñado especialmente para el registro escolar de herramientas.
 */

class SchoolExcelExporter {
  exportToExcel() {
    if (typeof XLSX === 'undefined') {
      alert('Error: La librería de Excel no se ha cargado. Verifica la conexión.');
      return;
    }

    const wb = XLSX.utils.book_new();
    const allLoans = window.db.getLoans();
    const allTools = window.db.getTools();
    const activeLoans = window.db.getActiveLoans();

    // -------------------------------------------------------------
    // HOJA 1: HISTORIAL COMPLETO
    // -------------------------------------------------------------
    const dataHistorial = allLoans.map((l, index) => ({
      'N°': index + 1,
      'Herramienta': l.toolName,
      'Persona que se la llevó': l.borrower,
      'Fecha y Hora de Salida': l.loanDate,
      'Estado': l.returned ? 'DEVUELTA' : 'EN USO (SIN DEVOLVER)',
      'Persona que la devolvió': l.returned ? l.returner : 'PENDIENTE',
      'Fecha y Hora de Devolución': l.returned ? l.returnDate : '-'
    }));

    const wsHistorial = XLSX.utils.json_to_sheet(
      dataHistorial.length > 0 ? dataHistorial : [{ 'Aviso': 'No hay registros todavía' }]
    );

    // Ajustar ancho de columnas
    wsHistorial['!cols'] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 24 },
      { wch: 22 },
      { wch: 24 },
      { wch: 24 },
      { wch: 22 }
    ];
    XLSX.utils.book_append_sheet(wb, wsHistorial, 'Historial_Prestamos');

    // -------------------------------------------------------------
    // HOJA 2: HERRAMIENTAS ACTUALMENTE PRESTADAS (EN USO)
    // -------------------------------------------------------------
    const dataActivos = activeLoans.map((l, index) => ({
      'N°': index + 1,
      'Herramienta': l.toolName,
      'Alumno / Persona que la tiene': l.borrower,
      'Se la llevó el día': l.loanDate
    }));

    const wsActivos = XLSX.utils.json_to_sheet(
      dataActivos.length > 0 ? dataActivos : [{ 'Estado': '¡Todas las herramientas están en el taller! (Ninguna prestada)' }]
    );
    wsActivos['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 26 }, { wch: 24 }];
    XLSX.utils.book_append_sheet(wb, wsActivos, 'Herramientas_En_Uso');

    // -------------------------------------------------------------
    // HOJA 3: LISTA GENERAL DE HERRAMIENTAS
    // -------------------------------------------------------------
    const dataHerramientas = allTools.map((toolName, index) => {
      const isAvailable = window.db.isToolAvailable(toolName);
      const holder = window.db.getToolHolder(toolName);
      return {
        'N°': index + 1,
        'Nombre de la Herramienta': toolName,
        'Estado': isAvailable ? 'Disponible' : 'Prestada',
        'En poder de': holder || '-'
      };
    });

    const wsTools = XLSX.utils.json_to_sheet(dataHerramientas);
    wsTools['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 16 }, { wch: 24 }];
    XLSX.utils.book_append_sheet(wb, wsTools, 'Inventario_Herramientas');

    // Nombre de archivo con fecha
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const filename = `Control_Herramientas_Colegio_${dateStr}.xlsx`;

    // Guardar archivo (compatible con celulares y PC)
    try {
      XLSX.writeFile(wb, filename);
    } catch (e) {
      // Fallback para navegadores móviles
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
    }

    return filename;
  }
}

window.schoolExcel = new SchoolExcelExporter();
