@echo off
title Control de Herramientas - Colegio
color 0B
chcp 65001 >nul

echo ==============================================================
echo   🧰 CONTROL DE PAÑOL Y HERRAMIENTAS (MODO LOCAL Y MÓVIL)
echo ==============================================================
echo.

where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [✔] Node.js detectado. Iniciando servidor local...
    echo.
    echo   💻 En esta PC:     http://localhost:3000
    echo   📱 En tu Celular:  Conectate a la misma red Wi-Fi y mira la IP abajo.
    echo.
    start "" "http://localhost:3000"
    node server.js
) else (
    echo [!] Node.js no está en el PATH. Abriendo directamente en tu navegador...
    start "" "index.html"
    echo.
    echo [✔] La aplicación funciona directamente sin necesidad de internet.
    pause
)
