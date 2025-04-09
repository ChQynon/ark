@echo off
echo === Запуск Telegram-бота ARK-1 в режиме разработки ===
echo.

cd %~dp0
echo Текущая директория: %CD%
echo.

echo Проверка наличия зависимостей...
if not exist "node_modules" (
    echo Зависимости не установлены!
    echo Сначала запустите install.bat для установки зависимостей.
    pause
    exit /b 1
)

echo Запуск бота в режиме разработки...
echo (Для остановки нажмите Ctrl+C)
echo.

call npx ts-node src/index.ts
if %ERRORLEVEL% NEQ 0 (
    echo Ошибка при запуске!
    echo Пробуем альтернативный способ...
    call C:\Program Files\nodejs\npx.cmd ts-node src/index.ts
)

pause 