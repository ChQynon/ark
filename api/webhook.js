// Файл api/webhook.js для Vercel Serverless Functions
// Этот файл нужен, чтобы Vercel правильно маршрутизировал запросы от Telegram

// Импортируем основной файл с ботом
import '../dist/index.js';

// Простой обработчик, который просто подтверждает получение вебхука
// Основная логика бота выполняется в импортированном файле
export default function handler(req, res) {
  console.log('Получен вебхук в /api/webhook.js');
  // Просто возвращаем успешный статус
  // Это нужно только для того, чтобы Telegram понял, что вебхук работает
  res.status(200).json({ ok: true });
} 