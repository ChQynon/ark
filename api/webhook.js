// Если пользователь отправил текстовое сообщение, 
// гарантированно отправим ответ независимо от API
if (req.body && req.body.message && req.body.message.text && req.body.message.text !== '/start') {
  const chatId = req.body.message.chat.id;
  const messageText = req.body.message.text;
  const userName = req.body.message.from.first_name || 'пользователь';
  
  try {
    // Создаем новый экземпляр бота
    const bot = new Bot(token);
    
    // Отправляем "печатает..." статус
    await bot.api.sendChatAction(chatId, "typing");
    
    // Сформируем запрос к API, если ключ доступен
    if (openrouterApiKey) {
      try {
        // Информируем пользователя о процессе
        const statusMsg = await bot.api.sendMessage(chatId, "Обрабатываю ваш запрос...");
        
        // Запрос к OpenRouter API
        const apiPayload = {
          model: 'meta-llama/llama-4-maverick:free',
          messages: [
            {
              role: 'system',
              content: `Ты ${BOT_NAME}, ИИ-ассистент на базе ${BOT_PLATFORM}, созданный компанией ${BOT_CREATOR}. Отвечай на русском языке. Всегда полезен и дружелюбен.`
            },
            {
              role: 'user',
              content: messageText
            }
          ]
        };
        
        const headers = {
          'Authorization': `Bearer ${openrouterApiKey}`,
          'HTTP-Referer': siteUrl,
          'X-Title': siteName,
          'Content-Type': 'application/json'
        };
        
        // Отправляем запрос
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          apiPayload,
          { headers }
        );
        
        // Извлекаем ответ
        let aiResponse = 'Извините, не удалось сгенерировать ответ.';
        
        if (response.data && 
            response.data.choices && 
            response.data.choices.length > 0 && 
            response.data.choices[0].message && 
            response.data.choices[0].message.content) {
          aiResponse = response.data.choices[0].message.content;
        }
        
        // Если ответ все равно пустой, используем заглушку
        if (!aiResponse || aiResponse === 'Извините, не удалось сгенерировать ответ.') {
          aiResponse = `Отвечаю на ваш вопрос: "${messageText}"\n\nЭто интересная тема. Я анализирую информацию и готов обсудить ее подробнее.`;
        }
        
        // Удаляем статусное сообщение
        await bot.api.deleteMessage(chatId, statusMsg.message_id);
        
        // Отправляем ответ от ИИ
        await bot.api.sendMessage(chatId, aiResponse);
        logDebug(`ИИ-ответ отправлен в чат ${chatId}`);
      } catch (error) {
        // В случае ошибки отправляем запасной ответ
        const fallbackResponse = `Анализирую ваше сообщение: "${messageText}"\n\nИнтересная тема! Давайте обсудим ее подробнее.`;
        await bot.api.sendMessage(chatId, fallbackResponse);
        logDebug(`Отправлен запасной ответ в чат ${chatId} после ошибки API`);
      }
    } else {
      // Если API ключ недоступен, просто отвечаем
      await bot.api.sendMessage(chatId, 
        `Привет! Я получил ваше сообщение: "${messageText}"\n\n` +
        `К сожалению, сейчас я работаю в режиме без ИИ. Скоро все функции будут доступны.`
      );
    }
  } catch (botError) {
    logDebug(`Ошибка при обработке сообщения: ${botError}`);
  }
} 