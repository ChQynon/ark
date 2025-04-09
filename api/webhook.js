// Импортируем скомпилированный файл бота
const bot = require('../dist/index.js');

module.exports = async (req, res) => {
  try {
    console.log('Получен запрос на webhook:', {
      method: req.method,
      headers: req.headers,
      bodyLength: req.body ? JSON.stringify(req.body).length : 0
    });

    if (req.method === 'POST') {
      // Проверяем, что пришли данные
      if (!req.body) {
        console.error('Получен пустой POST запрос');
        return res.status(400).send('No request body');
      }

      // Проверяем, что это обновление от Telegram
      if (!req.body.update_id && !req.body.message && !req.body.callback_query) {
        console.error('Получен неверный формат данных от Telegram:', req.body);
        return res.status(400).send('Invalid Telegram update format');
      }

      console.log('Обрабатываем обновление от Telegram:', JSON.stringify(req.body));

      // Передаем запрос боту для обработки
      await bot(req, res);
    } else {
      // Простой ответ для GET запросов
      console.log('Получен GET запрос, отправляем приветствие');
      res.status(200).send('Webhook активен. Отправьте POST запрос для обработки обновлений Telegram.');
    }
  } catch (error) {
    console.error('Ошибка в вебхуке:', error);
    res.status(500).send(`Внутренняя ошибка сервера: ${error.message}`);
  }
}; 