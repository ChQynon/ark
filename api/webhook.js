// Файл api/webhook.js для Vercel Serverless Functions
// Этот файл нужен, чтобы Vercel правильно маршрутизировал запросы от Telegram

// Простейший автономный обработчик вебхуков Telegram
const { Bot } = require('grammy');

module.exports = async (req, res) => {
  console.log('===== WEBHOOK ПОЛУЧЕН =====');
  
  try {
    // Получаем токен из переменных окружения
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!token) {
      console.error('ОШИБКА: Токен бота не найден!');
      return res.status(200).send('OK');
    }
    
    // Логируем полученный запрос
    console.log('Метод:', req.method);
    if (req.body) console.log('Тело:', JSON.stringify(req.body).substring(0, 500));
    
    // Выясняем, действительно ли это сообщение от Telegram
    if (req.body && req.body.message) {
      const chatId = req.body.message.chat.id;
      const messageText = req.body.message.text || 'нетекстовое сообщение';
      const userName = req.body.message.from.first_name || 'пользователь';
      
      console.log(`Получено сообщение от ${userName} (${chatId}): ${messageText}`);
      
      // Создаем новый экземпляр бота (отдельный от основного приложения)
      const bot = new Bot(token);
      
      // Сразу отправляем успешный ответ, чтобы Telegram не ждал
      res.status(200).send('OK');
      
      // Отправляем прямой ответ пользователю
      await bot.api.sendMessage(chatId, 
        `👋 Привет, ${userName}! Я получил ваше сообщение: "${messageText}"\n\n` +
        `✅ Бот работает в аварийном режиме без ИИ-функций.`
      );
      
      console.log(`Ответ успешно отправлен в чат ${chatId}`);
      return;
    }
    
    console.log('Запрос не содержит сообщения Telegram');
    return res.status(200).send('OK');
    
  } catch (error) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА:', error);
    
    // Всегда отвечаем успешно, чтобы Telegram не пытался повторить
    return res.status(200).send('OK');
  }
}; 