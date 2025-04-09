# Телеграм-бот ARK-1

Русскоязычный Telegram-бот, созданный на базе PLEXY компанией @samgay_nis, который отвечает на прямые сообщения и команды `/ai` с использованием OpenRouter API.

## Возможности

- Отвечает на прямые сообщения пользователям
- Отвечает на команды `/ai` в разрешенном чате (например, `/ai Какая столица Франции?`)
- Анализирует изображения с помощью ИИ
- Имеет удобные кнопки для взаимодействия
- Работает только в личных сообщениях и в группе с ID: -1002567822254
- Запоминает историю чатов и отвечает с учетом контекста
- Поддерживает развертывание на Vercel с использованием вебхуков

## Быстрая установка (для Windows)

В проекте есть готовые BAT-файлы, упрощающие настройку и запуск:

1. Выполните `install.bat` для установки всех зависимостей и компиляции
2. Запустите `start.bat` чтобы запустить бота

Для запуска в режиме разработки используйте `dev.bat`

## Ручная настройка

1. Убедитесь, что у вас установлен Node.js (рекомендуется версия 16 или выше)
2. Установите зависимости:
   ```
   npm install
   ```
3. Настройте переменные окружения:
   - Скопируйте `.env.example` в `.env`
   - Файл `.env` уже содержит токен бота Telegram и ключ API OpenRouter
   - При необходимости можно изменить `YOUR_SITE_URL` и `YOUR_SITE_NAME`
4. Соберите проект:
   ```
   npm run build
   ```
5. Запустите бота:
   ```
   npm start
   ```

## Деплой на Vercel

Для размещения бота на Vercel:

1. Форкните или клонируйте репозиторий на GitHub
2. Создайте новый проект на Vercel, связав его с вашим GitHub репозиторием
3. Установите следующие переменные окружения в настройках проекта Vercel:
   - `TELEGRAM_BOT_TOKEN` - токен вашего Telegram бота
   - `OPENROUTER_API_KEY` - ключ API OpenRouter
   - `WEBHOOK_URL` - URL вашего приложения на Vercel + "/api/webhook" (например, https://ark-bot.vercel.app/api/webhook)
   - `VERCEL` - установите значение "1"
4. После деплоя на Vercel, установите вебхук для вашего Telegram бота:
   ```
   curl -X POST https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=<WEBHOOK_URL>
   ```

## Решение проблем с PowerShell

Если у вас возникают проблемы с запуском npm в PowerShell, см. инструкции в файле `PowerShell-FIX.md`.

## Использование бота

- Отправляйте прямые сообщения боту для получения ответов ИИ
- В групповых чатах используйте `/ai`, за которым следует ваш запрос (например, `/ai Какая погода в Москве?`)
- Отправляйте изображения для анализа или с вопросами о них
- Используйте кнопки для быстрого доступа к функциям
- Нажмите "🧹 Очистить историю" чтобы сбросить контекст разговора

## Персона бота

- Имя: ARK-1
- Платформа: PLEXY
- Создан: @samgay_nis
- Язык: Русский

## Структура проекта

```
├── src/                   # Исходный код
│   └── index.ts           # Основной файл бота
├── api/                   # API endpoints для Vercel
│   └── webhook.js         # Обработчик вебхуков Telegram
├── .env                   # Переменные окружения (не включены в репозиторий)
├── .env.example           # Пример файла с переменными окружения
├── vercel.json            # Конфигурация для деплоя на Vercel
├── tsconfig.json          # Конфигурация TypeScript
├── package.json           # Зависимости и скрипты
├── install.bat            # Скрипт установки для Windows
├── start.bat              # Скрипт запуска для Windows
└── dev.bat                # Скрипт запуска в режиме разработки для Windows
```

## Примечание

Для непрерывной работы бота рекомендуется использовать менеджер процессов, например PM2, или развернуть его на хостинге Vercel. 