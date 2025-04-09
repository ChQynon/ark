// Импортируем скомпилированный файл бота
const bot = require('../dist/index.js');

// СУПЕР-ПРОСТОЙ ОБРАБОТЧИК
module.exports = async (req, res) => {
  // ВСЕГДА возвращаем OK, не ждем обработки
  res.status(200).send('OK');
  
  try {
    // Проверяем есть ли тело
    if (!req.body) {
      console.error('ВЕБХУК: Пустой запрос без тела');
      return;
    }
    
    // Логируем запрос
    console.log(`ВЕБХУК: Получен запрос ID=${req.body.update_id || 'НЕТ_ID'}`);
    
    // Пропускаем не POST запросы
    if (req.method !== 'POST') {
      console.error(`ВЕБХУК: Пропуск запроса метода ${req.method}`);
      return;
    }
    
    // Запускаем обработку без блокировки текущего потока
    const update = req.body;
    setTimeout(() => {
      // 1. Запускаем обработку
      try {
        bot(req, { headersSent: true })
          .then(() => console.log(`ВЕБХУК: Успешно обработан запрос ID=${update.update_id || 'НЕТ_ID'}`))
          .catch(e => console.error(`ВЕБХУК: Ошибка обработки: ${e.message}`));
      } catch (e) {
        console.error(`ВЕБХУК: Критическая ошибка обработки: ${e.message}`);
      }
    }, 0);
  } 
  catch (error) {
    console.error(`ВЕБХУК: СИСТЕМНАЯ ОШИБКА: ${error.message}`);
  }
}; 