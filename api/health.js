// Эндпоинт для проверки состояния бота и настройки вебхука

// Проверка, идет ли запрос из браузера
function isBrowser(req) {
  return req.headers && req.headers['user-agent'] && 
         req.headers['user-agent'].includes('Mozilla');
}

module.exports = async (req, res) => {
  console.log('Запрос на /api/health');
  
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const webhookUrl = process.env.WEBHOOK_URL;
  
  // Базовые данные о состоянии
  const healthData = {
    status: 'ok',
    bot_name: 'ARK-1',
    platform: 'PLEXY',
    creator: '@samgay_nis',
    webhook_url: webhookUrl || 'не указан',
    token_available: !!token,
    timestamp: new Date().toISOString(),
    mode: 'аварийный режим (без ИИ-функций)',
    environment: process.env.VERCEL ? 'Vercel' : 'Локальный'
  };
  
  // Если запрос из браузера, добавляем HTML интерфейс
  if (isBrowser(req)) {
    const webhookSetupUrl = webhookUrl ? 
      `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}` : 
      '#';
    
    const webhookInfoUrl = token ? 
      `https://api.telegram.org/bot${token}/getWebhookInfo` : 
      '#';
    
    // Формируем HTML страницу
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>ARK-1 Bot Status</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          .status { background: #f5f5f5; padding: 15px; border-radius: 5px; }
          .card { margin-top: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
          .success { color: green; }
          .error { color: red; }
          .button { display: inline-block; background: #4CAF50; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px; margin-right: 10px; }
          pre { background: #f5f5f5; padding: 10px; overflow: auto; }
        </style>
      </head>
      <body>
        <h1>ARK-1 Bot Status</h1>
        
        <div class="status">
          <h2>Статус: <span class="${healthData.token_available ? 'success' : 'error'}">
            ${healthData.token_available ? 'Активен' : 'Ошибка конфигурации'}
          </span></h2>
          <p>Режим работы: ${healthData.mode}</p>
          <p>Окружение: ${healthData.environment}</p>
          <p>Время проверки: ${healthData.timestamp}</p>
        </div>
        
        <div class="card">
          <h3>Конфигурация вебхука</h3>
          <p>URL вебхука: ${webhookUrl || '<не задан>'}</p>
          <p>Токен доступен: ${healthData.token_available ? 'Да' : 'Нет'}</p>
          
          <div>
            <a href="${webhookSetupUrl}" class="button" target="_blank">Установить вебхук</a>
            <a href="${webhookInfoUrl}" class="button" target="_blank">Проверить состояние вебхука</a>
          </div>
        </div>
        
        <div class="card">
          <h3>Подробная информация</h3>
          <pre>${JSON.stringify(healthData, null, 2)}</pre>
        </div>
      </body>
    </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  }
  
  // JSON ответ для программных запросов
  return res.status(200).json(healthData);
}; 