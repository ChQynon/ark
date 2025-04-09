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
  const openrouterApiKey = process.env.OPENROUTER_API_KEY;
  
  // Проверяем доступность всех компонентов
  const tokenAvailable = !!token;
  const webhookAvailable = !!webhookUrl;
  const aiAvailable = !!openrouterApiKey;
  
  // Определяем режим работы
  let mode = 'недоступен - отсутствует токен';
  if (tokenAvailable) {
    mode = aiAvailable ? 'полнофункциональный (с ИИ)' : 'базовый (без ИИ-функций)';
  }
  
  // Базовые данные о состоянии
  const healthData = {
    status: tokenAvailable ? 'ok' : 'error',
    bot_name: 'ARK-1',
    platform: 'PLEXY',
    creator: '@samgay_nis',
    webhook_url: webhookUrl || 'не указан',
    token_available: tokenAvailable,
    ai_available: aiAvailable,
    timestamp: new Date().toISOString(),
    mode: mode,
    environment: process.env.VERCEL ? 'Vercel' : 'Локальный'
  };
  
  // Если запрос из браузера, добавляем HTML интерфейс
  if (isBrowser(req)) {
    const webhookSetupUrl = webhookUrl && token ? 
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
          .warning { color: orange; }
          .error { color: red; }
          .button { display: inline-block; background: #4CAF50; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px; margin-right: 10px; margin-bottom: 10px; }
          .button.warning { background: orange; }
          pre { background: #f5f5f5; padding: 10px; overflow: auto; }
          
          @media (max-width: 600px) {
            .button { display: block; margin-bottom: 10px; text-align: center; }
          }
        </style>
      </head>
      <body>
        <h1>ARK-1 Bot Status</h1>
        
        <div class="status">
          <h2>Статус: <span class="${tokenAvailable ? 'success' : 'error'}">
            ${tokenAvailable ? 'Активен' : 'Ошибка конфигурации'}
          </span></h2>
          <p>Режим работы: <span class="${aiAvailable ? 'success' : 'warning'}">${mode}</span></p>
          <p>ИИ-функции: <span class="${aiAvailable ? 'success' : 'error'}">${aiAvailable ? 'Доступны' : 'Недоступны'}</span></p>
          <p>Окружение: ${healthData.environment}</p>
          <p>Время проверки: ${healthData.timestamp}</p>
        </div>
        
        <div class="card">
          <h3>Конфигурация вебхука</h3>
          <p>URL вебхука: <span class="${webhookAvailable ? 'success' : 'error'}">${webhookUrl || '<не задан>'}</span></p>
          <p>Токен бота: <span class="${tokenAvailable ? 'success' : 'error'}">${tokenAvailable ? 'Доступен' : 'Отсутствует'}</span></p>
          <p>OpenRouter API: <span class="${aiAvailable ? 'success' : 'error'}">${aiAvailable ? 'Настроен' : 'Не настроен'}</span></p>
          
          <div>
            <a href="${webhookSetupUrl}" class="button" target="_blank" ${!tokenAvailable || !webhookAvailable ? 'disabled style="opacity:0.5"' : ''}>Установить вебхук</a>
            <a href="${webhookInfoUrl}" class="button" target="_blank" ${!tokenAvailable ? 'disabled style="opacity:0.5"' : ''}>Проверить состояние вебхука</a>
          </div>
        </div>
        
        <div class="card">
          <h3>Необходимые переменные окружения</h3>
          <p>Эти переменные должны быть настроены в панели управления Vercel:</p>
          <ul>
            <li>TELEGRAM_BOT_TOKEN: <span class="${tokenAvailable ? 'success' : 'error'}">${tokenAvailable ? 'Настроен ✓' : 'Не настроен ✗'}</span></li>
            <li>WEBHOOK_URL: <span class="${webhookAvailable ? 'success' : 'error'}">${webhookAvailable ? 'Настроен ✓' : 'Не настроен ✗'}</span></li>
            <li>OPENROUTER_API_KEY: <span class="${aiAvailable ? 'success' : 'error'}">${aiAvailable ? 'Настроен ✓' : 'Не настроен ✗'}</span></li>
          </ul>
          
          <a href="https://vercel.com/dashboard" class="button warning" target="_blank">Открыть настройки Vercel</a>
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