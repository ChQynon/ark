// Импортируем скомпилированный файл бота
const bot = require('../dist/index.js');

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      // Передаем запрос боту для обработки
      await bot(req, res);
    } else {
      // Простой ответ для GET запросов
      res.status(200).send('Webhook активен. Отправьте POST запрос для обработки обновлений Telegram.');
    }
  } catch (error) {
    console.error('Ошибка в вебхуке:', error);
    res.status(500).send('Внутренняя ошибка сервера');
  }
}; 