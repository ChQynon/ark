// Импортируем скомпилированный файл бота
const bot = require('../dist/index.js');

// Хранилище для проверки дубликатов запросов
const processedUpdateIds = new Set();

// Функция для проверки дубликатов
function isDuplicate(updateId) {
  if (!updateId) return false;
  if (processedUpdateIds.has(updateId)) return true;
  
  // Добавляем новый ID
  processedUpdateIds.add(updateId);
  
  // Очищаем кеш если слишком большой
  if (processedUpdateIds.size > 1000) {
    const iter = processedUpdateIds.values();
    processedUpdateIds.delete(iter.next().value);
  }
  
  return false;
}

module.exports = async (req, res) => {
  try {
    // Всегда мгновенно отвечаем Telegram
    res.status(200).send('OK');

    if (req.method !== 'POST' || !req.body) {
      return; // Игнорируем все кроме POST с данными
    }
    
    const updateId = req.body.update_id;
    
    // Проверяем дубликаты запросов по ID
    if (isDuplicate(updateId)) {
      console.log(`Вебхук: игнорирую дублирующий запрос с ID ${updateId}`);
      return;
    }
    
    // Логируем минимум информации
    console.log(`Вебхук получил запрос: ${updateId}, ${!!req.body.message ? 'сообщение' : 'другой тип'}`);
    
    // Асинхронно обрабатываем запрос
    bot(req, res).catch(error => {
      console.error('Ошибка обработки вебхука:', error.message);
    });
  } catch (error) {
    console.error('Критическая ошибка в вебхуке:', error);
  }
}; 