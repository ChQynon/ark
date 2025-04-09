# Настройка вебхука для Telegram бота на Vercel

После успешного развертывания вашего бота на Vercel, вам необходимо настроить вебхук для Telegram API. Это позволит Telegram отправлять обновления на ваш сервер.

## Автоматизированный способ (через GitHub Actions)

Если вы используете GitHub Actions, вы можете добавить автоматическую настройку вебхука после деплоя. Вам нужно будет создать workflow файл с шагом настройки вебхука.

## Ручной способ (через curl)

1. Подставьте ваш токен бота и URL вебхука в следующую команду:

```bash
curl -X POST https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=<WEBHOOK_URL>
```

Например:

```bash
curl -X POST https://api.telegram.org/bot7800529246:AAGAEIBNRmwsLul6bQeGqi8yKHutIh6If2o/setWebhook?url=https://ark-seven.vercel.app/api/webhook
```

2. Для проверки текущего статуса вебхука выполните:

```bash
curl -X GET https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo
```

## Ручной способ (через браузер)

Вы также можете настроить вебхук, открыв URL в браузере:

```
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=<WEBHOOK_URL>
```

## Важные замечания

1. URL вебхука должен использовать HTTPS и иметь действительный SSL-сертификат (Vercel предоставляет это автоматически)
2. Убедитесь, что значение `WEBHOOK_URL` в переменных окружения на Vercel совпадает с URL, который вы используете при настройке вебхука.
3. В случае ошибок проверьте журналы функции в Vercel и журналы вебхука Telegram.

## Удаление вебхука

Если вам нужно удалить вебхук (например, для переключения на локальный режим разработки):

```bash
curl -X POST https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/deleteWebhook
``` 