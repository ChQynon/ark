@echo off
echo === Установка зависимостей для Telegram-бота ARK-1 ===
echo.

cd %~dp0
echo Текущая директория: %CD%
echo.

echo Установка пакетов...
call npm install grammy dotenv axios @types/node typescript ts-node
if %ERRORLEVEL% NEQ 0 (
    echo Ошибка при установке пакетов!
    echo Пробуем альтернативный способ...
    call C:\Program Files\nodejs\npm.cmd install grammy dotenv axios @types/node typescript ts-node
)

echo.
echo Компиляция TypeScript...
call npx tsc
if %ERRORLEVEL% NEQ 0 (
    echo Ошибка при компиляции!
    echo Пробуем альтернативный способ...
    call C:\Program Files\nodejs\npx.cmd tsc
)

echo.
echo === Установка и компиляция завершены ===
echo.
echo Для запуска бота используйте:
echo   npm start
echo или
echo   node dist/index.js
echo.
echo Для запуска в режиме разработки:
echo   npm run dev
echo или
echo   npx ts-node src/index.ts

pause 