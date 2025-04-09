// Импортируем скомпилированный файл бота
const bot = require('../dist/index.js');

// Предельно простой обработчик веб-запросов
module.exports = async (req, res) => {
  // Сразу отвечаем 200 OK для Telegram
  res.status(200).send('OK');
  
  // Если запрос не POST или нет тела - игнорируем
  if (req.method !== 'POST' || !req.body) {
    return;
  }
  
  // Просто перенаправляем запрос в бота и не ждем результата
  bot(req, res).catch(error => {
    console.log('Ошибка в webhook.js:', error.message);
  });
}; 