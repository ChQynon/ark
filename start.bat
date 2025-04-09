@echo off
echo === Запуск Telegram-бота ARK-1 ===
echo.

cd %~dp0
echo Текущая директория: %CD%
echo.

if not exist "dist\index.js" (
    echo Компиляция бота не найдена!
    echo Сначала запустите install.bat или выполните компиляцию.
    echo.
    echo Пробуем выполнить компиляцию...
    call npx tsc
    if %ERRORLEVEL% NEQ 0 (
        echo Ошибка при компиляции! Запустите install.bat
        pause
        exit /b 1
    )
)

echo Запуск бота...
echo (Для остановки нажмите Ctrl+C)
echo.
node dist/index.js

pause 