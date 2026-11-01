# 🧰 Control de Herramientas para el Colegio (Versión Simple y Rápida)

Programa adaptado para celulares y computadoras, pensado para el taller del colegio. Permite registrar rápidamente quién se llevó cada herramienta, quién la devuelve y exportar todo el historial a Excel (.xlsx).

---

## ⚡ ¿Cómo funciona? (Super Simple)

1. **🧰 Guardar Herramientas:**
   - En la pestaña **"Herramientas"**, solo escribes el nombre (ej: *Martillo*, *Tester*, *Tijera*) y le das a **Agregar**. Se guarda automáticamente.
   - También puedes escribirla directamente al momento de prestarla.

2. **➕ Anotar Préstamo:**
   - Escribes el nombre del alumno o persona que se la lleva (ej: *Lucas Martínez*).
   - Tocas las herramientas que se lleva con 1 toque en la pantalla.
   - Presionas **"Anotar Préstamo"**.

3. **📋 Ver Quién Tiene Qué:**
   - En la pestaña **"Prestadas"**, verás a cada persona con la lista exacta de herramientas que se llevó.
   - Cada herramienta tiene su botón verde **"↩️ Devolver"**.

4. **↩️ Devolver:**
   - Al presionar **"Devolver"**, se abre una ventana preguntando:
     - 🔘 **La misma persona** *(seleccionada por defecto)*
     - 🔘 **Otra persona** *(si la seleccionas, escribes el nombre de quién la trajo)*
   - Presionas **"Confirmar Devolución"** y la herramienta queda libre de nuevo.

5. **📊 Exportar a Excel:**
   - Presionas el botón verde **"📥 Descargar Planilla Excel (.xlsx)"** y se descarga un archivo de Excel con todas las columnas:
     - Herramienta
     - Persona que se la llevó y fecha/hora
     - Estado
     - Persona que la devolvió y fecha/hora

---

## 📱 Cómo abrirlo en el Celular o PC

- **En la computadora:** Abre el archivo [`index.html`](file:///c:/Users/Portfolio/Desktop/inventario/index.html) directamente en cualquier navegador (no necesita internet).
- **En tu Celular:** Con la PC y el celular conectados al mismo Wi-Fi:
  1. Ejecuta en la terminal de la PC: `npm start`
  2. Abre en tu celular la dirección IP que aparece (ej: `http://192.168.100.138:3000`).
