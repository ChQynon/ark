// Импортируем скомпилированный файл бота
const botHandler = require('../dist/index.js');

// Очень простой обработчик веб-запросов
module.exports = async (req, res) => {
  try {
    // Проверяем метод и тело запроса
    if (req.method !== 'POST' || !req.body) {
      return res.status(200).send('OK');
    }
    
    // Просто передаем запрос в модуль бота
    await botHandler(req, res);
    
  } catch (error) {
    // Логируем ошибку
    console.error('Ошибка в webhook.js:', error);
    
    // Всегда возвращаем 200 OK для Telegram
    if (!res.headersSent) {
      res.status(200).send('OK');
    }
  }
}; 