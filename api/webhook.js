// Файл api/webhook.js для Vercel Serverless Functions
// Этот файл нужен, чтобы Vercel правильно маршрутизировал запросы от Telegram

// Импортируем основной файл с ботом и необходимые библиотеки
import '../dist/index.js';
import { webhookCallback } from 'grammy';
import { Bot } from 'grammy';

// Расширенный обработчик вебхуков для Telegram
export default function handler(req, res) {
  console.log('**********');
  console.log('Получен вебхук в /api/webhook.js');
  console.log('Метод:', req.method);
  console.log('Заголовки:', JSON.stringify(req.headers, null, 2));
  
  try {
    // Проверяем, что body уже распарсен (обычно Vercel делает это автоматически)
    if (req.body) {
      console.log('Тело запроса получено:', JSON.stringify(req.body, null, 2).substring(0, 500));
    }
    
    // Если токен бота отсутствует, выходим
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.error('ОШИБКА: TELEGRAM_BOT_TOKEN не найден в переменных окружения');
      return res.status(500).json({ ok: false, error: 'Configuration error' });
    }
    
    // Создаем новый экземпляр бота (альтернативный способ обработки вебхука)
    const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
    
    // Обрабатываем вебхук с более детальным логированием
    console.log('Начинаем обработку вебхука через webhookCallback...');
    
    // Отправляем успешный ответ напрямую, чтобы Telegram не ждал
    res.status(200).json({ ok: true });
    
    // Обрабатываем данные в фоновом режиме
    if (req.body && req.body.message) {
      // Отправляем простой ответ на любое сообщение для проверки
      const chatId = req.body.message.chat.id;
      const messageText = req.body.message.text || 'не текстовое сообщение';
      
      bot.api.sendMessage(chatId, `Получено сообщение: ${messageText}. Бот работает в режиме прямого ответа.`)
        .then(() => console.log('Ответ успешно отправлен в чат', chatId))
        .catch(error => console.error('Ошибка при отправке ответа:', error));
    }
    
    console.log('Обработка вебхука завершена');
    console.log('**********');
  } catch (error) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА при обработке вебхука:', error);
    console.log('**********');
    
    // В случае ошибки всё равно отправляем успешный ответ Telegram,
    // чтобы он не пытался переотправить запрос
    res.status(200).json({ ok: true });
  }
} 