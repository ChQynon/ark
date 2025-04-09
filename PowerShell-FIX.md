# Обход ограничений PowerShell

Вы столкнулись с ограничением политики выполнения PowerShell, которое мешает запускать команды npm. Вот два способа решения:

## Способ 1: Изменить политику выполнения (временно)

1. Запустите PowerShell от имени администратора
2. Выполните команду:
```
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
3. Теперь вы можете выполнять команды npm в текущей сессии PowerShell

## Способ 2: Использовать Командную строку (CMD) вместо PowerShell

1. Откройте Командную строку Windows (cmd.exe)
2. Перейдите в папку проекта:
```
cd C:\Users\User\Downloads\ark
```
3. Выполните команды npm:
```
npm install
npm run build
npm start
```

## Способ 3: Прямое выполнение node (обходной путь)

Если ни один из вышеуказанных методов не работает, вы можете непосредственно использовать node:

1. Установите пакеты вручную через cmd.exe:
```
cd C:\Users\User\Downloads\ark
C:\Program Files\nodejs\npm.cmd install
```

2. Для запуска скомпилированного проекта:
```
node dist/index.js
```

## Примечание о зависимостях

Для корректной работы бота необходимо установить следующие пакеты:
- grammy
- dotenv
- axios
- @types/node

Их можно установить через командную строку Windows командой:
```
C:\Program Files\nodejs\npm.cmd install grammy dotenv axios @types/node
``` 