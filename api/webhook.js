// Файл api/webhook.js для Vercel Serverless Functions
// Этот файл нужен, чтобы Vercel правильно маршрутизировал запросы от Telegram

// Импорт необходимых модулей
const { Bot } = require('grammy');
const axios = require('axios');

// Конфигурация бота
const BOT_NAME = "ARK-1";
const BOT_PLATFORM = "PLEXY";
const BOT_CREATOR = "@samgay_nis";

// Расширенное логирование для отладки
function logDebug(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    try {
      if (typeof data === 'object') {
        console.log(JSON.stringify(data, null, 2).substring(0, 1000));
      } else {
        console.log(String(data).substring(0, 1000));
      }
    } catch (e) {
      console.log("[Ошибка при логировании данных]");
    }
  }
}

// Основной обработчик вебхуков
module.exports = async (req, res) => {
  logDebug('===== WEBHOOK ПОЛУЧЕН =====');
  
  try {
    // Получаем токены и настройки из переменных окружения
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    const siteUrl = process.env.YOUR_SITE_URL || 'https://ark-seven.vercel.app';
    const siteName = process.env.YOUR_SITE_NAME || 'ARK-1 Bot';
    
    // Показываем все переменные окружения (без значений токенов)
    logDebug('Переменные окружения:', {
      'TELEGRAM_BOT_TOKEN': token ? 'настроен' : 'не настроен',
      'OPENROUTER_API_KEY': openrouterApiKey ? 'настроен' : 'не настроен',
      'WEBHOOK_URL': process.env.WEBHOOK_URL || 'не настроен',
      'YOUR_SITE_URL': siteUrl,
      'YOUR_SITE_NAME': siteName,
      'VERCEL': process.env.VERCEL || 'не настроен'
    });
    
    // Проверяем наличие токена
    if (!token) {
      logDebug('ОШИБКА: Токен бота не найден!');
      return res.status(200).send('OK');
    }
    
    // Логируем полученный запрос
    logDebug('Метод запроса:', req.method);
    if (req.body) {
      logDebug('Тело запроса:', req.body);
    } else {
      logDebug('Тело запроса отсутствует');
    }
    
    // Отвечаем сразу, чтобы Telegram не ждал
    res.status(200).send('OK');
    
    // Выясняем, действительно ли это сообщение от Telegram
    if (req.body && req.body.message) {
      const chatId = req.body.message.chat.id;
      const messageText = req.body.message.text || '';
      const userName = req.body.message.from.first_name || 'пользователь';
      
      logDebug(`Получено сообщение от ${userName} (${chatId}): ${messageText}`);
      
      try {
        // Создаем новый экземпляр бота
        const bot = new Bot(token);
        logDebug('Бот инициализирован');
        
        // Если есть команда /start
        if (messageText === '/start') {
          logDebug('Обработка команды /start');
          try {
            await bot.api.sendMessage(chatId, 
              `👋 Привет, ${userName}! Я ${BOT_NAME}, ИИ-ассистент на базе ${BOT_PLATFORM}.\n` +
              `Создан компанией ${BOT_CREATOR}.\n\n` +
              `Я могу ответить на ваши вопросы и помочь с различными задачами.`
            );
            logDebug(`Ответ на /start отправлен в чат ${chatId}`);
          } catch (startError) {
            logDebug('Ошибка при отправке ответа на /start:', startError);
          }
          return;
        }
        
        // Отправляем "печатает..." статус
        try {
          await bot.api.sendChatAction(chatId, "typing");
          logDebug('Отправлен статус "печатает..."');
        } catch (typingError) {
          logDebug('Ошибка при отправке статуса "печатает...":', typingError);
        }
        
        // Если OPENROUTER API ключ доступен и есть текст сообщения
        if (openrouterApiKey && messageText) {
          logDebug('Начинаем обработку через OpenRouter API');
          
          try {
            // Информируем пользователя о процессе
            let statusMsg;
            try {
              statusMsg = await bot.api.sendMessage(chatId, "Обрабатываю ваш запрос...");
              logDebug('Отправлено сообщение о начале обработки');
            } catch (statusError) {
              logDebug('Ошибка при отправке статусного сообщения:', statusError);
            }
            
            // Формируем запрос к API с исправленным форматом
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
            
            logDebug('Запрос к OpenRouter API:', apiPayload);
            
            // Готовим заголовки запроса
            const headers = {
              'Authorization': `Bearer ${openrouterApiKey}`,
              'HTTP-Referer': siteUrl,
              'X-Title': siteName,
              'Content-Type': 'application/json'
            };
            
            logDebug('Отправляем запрос к OpenRouter API...');
            
            // Отправляем запрос к API
            const response = await axios.post(
              'https://openrouter.ai/api/v1/chat/completions',
              apiPayload,
              { headers }
            );
            
            logDebug('Получен ответ от OpenRouter API:', response.data);
            
            // Обработка ответа с проверкой всех вложенных полей
            let aiResponse = 'Извините, не удалось сгенерировать ответ.';
            
            if (response.data && 
                response.data.choices && 
                response.data.choices.length > 0 && 
                response.data.choices[0].message) {
              
              if (typeof response.data.choices[0].message.content === 'string') {
                aiResponse = response.data.choices[0].message.content;
              } else if (response.data.choices[0].message.content && 
                        Array.isArray(response.data.choices[0].message.content)) {
                // Для случая, когда ответ может быть массивом контента
                const contentParts = response.data.choices[0].message.content
                  .filter(item => item && item.type === 'text' && item.text)
                  .map(item => item.text);
                
                if (contentParts.length > 0) {
                  aiResponse = contentParts.join('\n');
                }
              }
            }
            
            logDebug('Извлеченный ответ ИИ:', aiResponse.substring(0, 100) + '...');
            
            // Удаляем статусное сообщение, если оно было отправлено
            if (statusMsg && statusMsg.message_id) {
              try {
                await bot.api.deleteMessage(chatId, statusMsg.message_id);
                logDebug('Статусное сообщение удалено');
              } catch (deleteError) {
                logDebug('Ошибка при удалении статусного сообщения:', deleteError);
              }
            }
            
            // Отправляем ответ от ИИ (без опции parse_mode)
            try {
              await bot.api.sendMessage(chatId, aiResponse, {
                disable_web_page_preview: true
              });
              logDebug(`ИИ-ответ успешно отправлен в чат ${chatId}`);
            } catch (sendError) {
              logDebug('Ошибка при отправке ИИ-ответа:', sendError);
              
              // Пробуем отправить без форматирования в случае ошибки
              try {
                await bot.api.sendMessage(chatId, 
                  'Произошла ошибка при отправке ответа. Возможно, ответ содержит неподдерживаемый формат. ' +
                  'Пожалуйста, попробуйте другой запрос.'
                );
              } catch (fallbackError) {
                logDebug('Критическая ошибка: не удалось отправить даже сообщение об ошибке', fallbackError);
              }
            }
            
          } catch (aiError) {
            logDebug('Ошибка при обращении к OpenRouter API:', aiError);
            
            if (aiError.response) {
              logDebug('Детали ошибки API:', {
                status: aiError.response.status,
                data: aiError.response.data
              });
            }
            
            // Отправляем сообщение об ошибке
            try {
              await bot.api.sendMessage(chatId, 
                'Извините, произошла ошибка при обработке вашего запроса через ИИ. ' +
                'Пожалуйста, попробуйте еще раз позже.'
              );
            } catch (errorMsgError) {
              logDebug('Не удалось отправить сообщение об ошибке:', errorMsgError);
            }
          }
        } else {
          // Если ключ OpenRouter не доступен или сообщение пустое
          if (messageText) {
            logDebug('OpenRouter API недоступен, отправляем простой ответ');
            try {
              await bot.api.sendMessage(chatId, 
                `Здравствуйте, ${userName}! К сожалению, функции ИИ временно недоступны.\n\n` +
                `Ваш запрос: "${messageText}"\n\n` +
                `Пожалуйста, повторите попытку позже.`
              );
              logDebug(`Простой ответ отправлен в чат ${chatId} (ИИ недоступен)`);
            } catch (simpleError) {
              logDebug('Ошибка при отправке простого ответа:', simpleError);
            }
          }
        }
      } catch (botError) {
        logDebug('Ошибка при инициализации бота:', botError);
      }
      
      return;
    } else {
      logDebug('Запрос не содержит сообщения Telegram или имеет неподдерживаемый формат');
    }
    
  } catch (error) {
    logDebug('КРИТИЧЕСКАЯ ОШИБКА в обработчике вебхуков:', error);
  } finally {
    logDebug('===== ОБРАБОТКА WEBHOOK ЗАВЕРШЕНА =====');
  }
}; 