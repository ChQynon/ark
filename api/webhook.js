// Импортируем скомпилированный файл бота
const bot = require('../dist/index.js');

// Максимально простой обработчик вебхуков
module.exports = async (req, res) => {
  // Немедленно отвечаем 200 OK, не ждем обработки
  res.status(200).send('OK');
  
  try {
    // Проверка на корректность запроса и выводим подробный лог
    console.log(`[webhook.js] Получен запрос: ${req.method}`, 
                req.body && req.body.update_id ? `ID: ${req.body.update_id}` : 'Нет ID');
    
    // Только для POST запросов с телом
    if (req.method === 'POST' && req.body) {
      // Передаем запрос в бота без ожидания
      setTimeout(() => {
        bot(req, res)
          .then(() => console.log(`[webhook.js] Обработан запрос: ${req.body.update_id}`))
          .catch(e => console.error(`[webhook.js] Ошибка обработки: ${e.message}`));
      }, 0);
    }
  } catch (error) {
    console.error(`[webhook.js] Критическая ошибка: ${error.message}`);
  }
}; 