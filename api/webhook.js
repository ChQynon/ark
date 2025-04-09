// Импортируем скомпилированный файл бота
const bot = require('../dist/index.js');

module.exports = async (req, res) => {
  try {
    // Мгновенно отвечаем Telegram для предотвращения таймаутов и дублирования
    res.status(200).send('OK');

    console.log('Webhook received:', {
      method: req.method,
      updateId: req.body?.update_id,
      hasMessage: !!req.body?.message
    });

    if (req.method === 'POST' && req.body) {
      // Асинхронно обрабатываем запрос без ожидания результата
      bot(req, res).catch(error => {
        console.error('Async webhook processing error:', error);
      });
    }
  } catch (error) {
    console.error('Webhook error:', error);
  }
}; 