// Эндпоинт для установки вебхука через браузер
import { Bot } from 'grammy';

export default async function handler(req, res) {
  console.log('Запрос на установку вебхука через /api/setwebhook');
  
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const webhookUrl = process.env.WEBHOOK_URL;
  
  if (!token || !webhookUrl) {
    return res.status(500).json({ 
      ok: false, 
      error: 'TELEGRAM_BOT_TOKEN или WEBHOOK_URL не указаны в переменных окружения' 
    });
  }
  
  const bot = new Bot(token);
  
  try {
    // Удаляем текущий вебхук
    await bot.api.deleteWebhook();
    console.log('Текущий вебхук удален');
    
    // Устанавливаем новый вебхук
    const result = await bot.api.setWebhook(webhookUrl);
    console.log('Результат установки вебхука:', result);
    
    // Получаем информацию о вебхуке для проверки
    const webhookInfo = await bot.api.getWebhookInfo();
    
    return res.status(200).json({
      ok: true,
      message: 'Вебхук успешно установлен',
      webhook_url: webhookUrl,
      webhook_info: webhookInfo
    });
  } catch (error) {
    console.error('Ошибка при установке вебхука:', error);
    return res.status(500).json({
      ok: false,
      error: String(error)
    });
  }
} 