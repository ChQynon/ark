// Файл api/webhook.js для Vercel Serverless Functions
// Этот файл нужен, чтобы Vercel правильно маршрутизировал запросы от Telegram

// Импорт необходимых модулей
const { Bot } = require('grammy');
const axios = require('axios');

// Конфигурация бота
const BOT_NAME = "ARK-1";
const BOT_PLATFORM = "PLEXY";
const BOT_CREATOR = "@samgay_nis";

// Основной обработчик вебхуков
module.exports = async (req, res) => {
  console.log('===== WEBHOOK ПОЛУЧЕН =====');
  
  try {
    // Получаем токены и настройки из переменных окружения
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    const siteUrl = process.env.YOUR_SITE_URL || 'https://ark-seven.vercel.app';
    const siteName = process.env.YOUR_SITE_NAME || 'ARK-1 Bot';
    
    // Проверяем наличие токена
    if (!token) {
      console.error('ОШИБКА: Токен бота не найден!');
      return res.status(200).send('OK');
    }
    
    // Логируем полученный запрос
    console.log('Метод:', req.method);
    if (req.body) console.log('Тело запроса:', JSON.stringify(req.body).substring(0, 500));
    
    // Отвечаем сразу, чтобы Telegram не ждал
    res.status(200).send('OK');
    
    // Выясняем, действительно ли это сообщение от Telegram
    if (req.body && req.body.message) {
      const chatId = req.body.message.chat.id;
      const messageText = req.body.message.text || '';
      const userName = req.body.message.from.first_name || 'пользователь';
      
      console.log(`Получено сообщение от ${userName} (${chatId}): ${messageText}`);
      
      // Создаем новый экземпляр бота
      const bot = new Bot(token);
      
      // Если есть команда /start
      if (messageText === '/start') {
        await bot.api.sendMessage(chatId, 
          `👋 Привет, ${userName}! Я ${BOT_NAME}, ИИ-ассистент на базе ${BOT_PLATFORM}.\n` +
          `Создан компанией ${BOT_CREATOR}.\n\n` +
          `Я могу ответить на ваши вопросы и помочь с различными задачами.`,
          { parse_mode: 'Markdown' }
        );
        console.log(`Ответ на /start отправлен в чат ${chatId}`);
        return;
      }
      
      // Отправляем "печатает..." статус
      await bot.api.sendChatAction(chatId, "typing");
      
      // Если OPENROUTER API ключ доступен, используем ИИ
      if (openrouterApiKey && messageText) {
        try {
          console.log('Отправляем запрос к OpenRouter API...');
          
          // Информируем пользователя о процессе
          const statusMsg = await bot.api.sendMessage(chatId, "Обрабатываю ваш запрос...");
          
          // Готовим запрос к OpenRouter API
          const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
              model: 'meta-llama/llama-4-maverick:free',
              messages: [
                {
                  role: 'system',
                  content: [
                    {
                      type: 'text',
                      text: `Ты ${BOT_NAME}, ИИ-ассистент на базе ${BOT_PLATFORM}, созданный компанией ${BOT_CREATOR}. Отвечай на русском языке. Всегда полезен и дружелюбен.`
                    }
                  ]
                },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: messageText
                    }
                  ]
                }
              ]
            },
            {
              headers: {
                'Authorization': `Bearer ${openrouterApiKey}`,
                'HTTP-Referer': siteUrl,
                'X-Title': siteName,
                'Content-Type': 'application/json',
              }
            }
          );
          
          // Получаем ответ от ИИ
          const aiResponse = response.data.choices[0].message.content || 'Извините, не удалось сгенерировать ответ.';
          console.log('OpenRouter API ответил:', aiResponse.substring(0, 100) + '...');
          
          // Удаляем статусное сообщение
          await bot.api.deleteMessage(chatId, statusMsg.message_id);
          
          // Отправляем ответ от ИИ
          await bot.api.sendMessage(chatId, aiResponse, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true
          });
          
          console.log(`ИИ-ответ успешно отправлен в чат ${chatId}`);
        } catch (aiError) {
          console.error('Ошибка при обращении к OpenRouter API:', aiError);
          
          // Отправляем сообщение об ошибке
          await bot.api.sendMessage(chatId, 
            'Извините, произошла ошибка при обработке вашего запроса через ИИ. ' +
            'Пожалуйста, попробуйте еще раз позже.'
          );
        }
      } else {
        // Если ключ OpenRouter не доступен, отправляем простой ответ
        if (messageText) {
          await bot.api.sendMessage(chatId, 
            `Здравствуйте, ${userName}! К сожалению, функции ИИ временно недоступны.\n\n` +
            `Ваш запрос: "${messageText}"\n\n` +
            `Пожалуйста, повторите попытку позже.`
          );
          console.log(`Простой ответ отправлен в чат ${chatId} (ИИ недоступен)`);
        }
      }
      
      return;
    }
    
    console.log('Запрос не содержит сообщения Telegram');
    
  } catch (error) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА:', error);
  }
}; 