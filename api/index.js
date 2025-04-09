// Корневой эндпоинт API
export default function handler(req, res) {
  res.status(200).json({
    message: "ARK-1 бот запущен и готов к работе",
    api_endpoints: {
      "/api/webhook": "Эндпоинт для вебхуков Telegram",
      "/api/health": "Проверка состояния бота",
      "/api/setwebhook": "Ручная установка вебхука"
    },
    instructions: "Используйте эти эндпоинты для управления ботом"
  });
} 