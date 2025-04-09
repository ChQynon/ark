"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const grammy_1 = require("grammy");
const dotenv = __importStar(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
dotenv.config();
// Bot configuration
const ALLOWED_GROUP_ID = -1002567822254;
const BOT_NAME = "ARK-1";
const BOT_PLATFORM = "PLEXY";
const BOT_CREATOR = "@samgay_nis";
// Bot introduction message
const BOT_INTRO = `👋 Привет! Я ${BOT_NAME}, ИИ-ассистент на базе ${BOT_PLATFORM}.
Создан компанией ${BOT_CREATOR}.
Я могу ответить на ваши вопросы и обработать изображения.`;
// Check if environment variables are set
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const YOUR_SITE_URL = process.env.YOUR_SITE_URL || 'https://tgaibot.example.com';
const YOUR_SITE_NAME = process.env.YOUR_SITE_NAME || 'TelegramAIBot';
if (!TELEGRAM_BOT_TOKEN || !OPENROUTER_API_KEY) {
    console.error('Ошибка: TELEGRAM_BOT_TOKEN или OPENROUTER_API_KEY не указаны в файле .env');
    process.exit(1);
}
// Initialize the bot
const bot = new grammy_1.Bot(TELEGRAM_BOT_TOKEN);
// Configure sessions
bot.use((0, grammy_1.session)({
    initial: () => ({
        waitingForCompletion: false,
    }),
}));
// Check if message is from allowed group
function isAllowedGroup(ctx) {
    return ctx.chat?.type === "private" || ctx.chat?.id === ALLOWED_GROUP_ID;
}
// Create main keyboard
function getMainKeyboard() {
    return new grammy_1.Keyboard()
        .text("❓ Задать вопрос")
        .text("📸 Анализ изображения")
        .row()
        .text("ℹ️ О боте")
        .text("📚 Помощь")
        .resized();
}
// Handle start command
bot.command("start", async (ctx) => {
    if (!isAllowedGroup(ctx))
        return;
    await ctx.reply(BOT_INTRO, {
        reply_markup: getMainKeyboard(),
    });
});
// Handle help command
bot.command("help", async (ctx) => {
    if (!isAllowedGroup(ctx))
        return;
    const helpText = `📚 *Как пользоваться ботом ${BOT_NAME}*:

1️⃣ *Прямые сообщения*: просто напишите мне ваш вопрос
2️⃣ *Команда в чате*: используйте команду /ai + ваш вопрос
3️⃣ *Отправка фото*: отправьте фото с описанием или вопросом
4️⃣ *Кнопки*: используйте кнопки внизу для быстрого доступа

Создано компанией ${BOT_CREATOR} на базе ${BOT_PLATFORM}.`;
    await ctx.reply(helpText, {
        parse_mode: "Markdown",
        reply_markup: getMainKeyboard(),
    });
});
// Handle about command
bot.command("about", async (ctx) => {
    if (!isAllowedGroup(ctx))
        return;
    await ctx.reply(`ℹ️ *О боте*\n\nЯ ${BOT_NAME}, передовой ИИ-ассистент, разработанный на базе ${BOT_PLATFORM}.\nСоздан компанией ${BOT_CREATOR}.\n\nВерсия: 1.0.0`, {
        parse_mode: "Markdown",
        reply_markup: getMainKeyboard(),
    });
});
// Handle keyboard button presses
bot.hears("❓ Задать вопрос", async (ctx) => {
    if (!isAllowedGroup(ctx))
        return;
    await ctx.reply("Пожалуйста, введите ваш вопрос:", {
        reply_markup: { remove_keyboard: true },
    });
});
bot.hears("📸 Анализ изображения", async (ctx) => {
    if (!isAllowedGroup(ctx))
        return;
    await ctx.reply("Пожалуйста, отправьте изображение для анализа:", {
        reply_markup: { remove_keyboard: true },
    });
});
bot.hears("ℹ️ О боте", async (ctx) => {
    if (!isAllowedGroup(ctx))
        return;
    await ctx.reply(`ℹ️ *О боте*\n\nЯ ${BOT_NAME}, передовой ИИ-ассистент, разработанный на базе ${BOT_PLATFORM}.\nСоздан компанией ${BOT_CREATOR}.\n\nВерсия: 1.0.0`, {
        parse_mode: "Markdown",
        reply_markup: getMainKeyboard(),
    });
});
bot.hears("📚 Помощь", async (ctx) => {
    if (!isAllowedGroup(ctx))
        return;
    const helpText = `📚 *Как пользоваться ботом ${BOT_NAME}*:

1️⃣ *Прямые сообщения*: просто напишите мне ваш вопрос
2️⃣ *Команда в чате*: используйте команду /ai + ваш вопрос
3️⃣ *Отправка фото*: отправьте фото с описанием или вопросом
4️⃣ *Кнопки*: используйте кнопки внизу для быстрого доступа

Создано компанией ${BOT_CREATOR} на базе ${BOT_PLATFORM}.`;
    await ctx.reply(helpText, {
        parse_mode: "Markdown",
        reply_markup: getMainKeyboard(),
    });
});
// Handle direct messages (excluding commands)
bot.on('message:text', async (ctx) => {
    // Skip if not allowed group
    if (!isAllowedGroup(ctx))
        return;
    // Skip if it's a command
    if (ctx.message.text.startsWith('/'))
        return;
    // Handle the message
    await handleAIRequest(ctx, ctx.message.text);
});
// Handle photo messages
bot.on('message:photo', async (ctx) => {
    // Skip if not allowed group
    if (!isAllowedGroup(ctx))
        return;
    try {
        if (ctx.session.waitingForCompletion) {
            await ctx.reply("Я все еще обрабатываю ваш предыдущий запрос. Пожалуйста, подождите.");
            return;
        }
        // Set waiting status
        ctx.session.waitingForCompletion = true;
        // Send typing indicator
        await ctx.api.sendChatAction(ctx.chat.id, "typing");
        // Get photo details
        const photoInfo = ctx.message.photo;
        const fileId = photoInfo[photoInfo.length - 1].file_id; // Get highest quality image
        // Get file path
        const fileInfo = await ctx.api.getFile(fileId);
        const filePath = fileInfo.file_path;
        // Form full photo URL
        const photoUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
        // Get caption if any, or use default
        const caption = ctx.message.caption || "Опиши, что на этом изображении";
        // Notify user that we're processing
        const statusMsg = await ctx.reply("Обрабатываю изображение...");
        // Call OpenRouter API with the image
        const response = await callOpenRouterAPIWithImage(caption, photoUrl);
        // Delete the status message
        await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
        // Build inline keyboard for more actions
        const inlineKeyboard = new grammy_1.InlineKeyboard()
            .text("Подробнее", "more_details")
            .text("Перевести", "translate");
        // Send the AI response
        await ctx.reply(response, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            reply_markup: inlineKeyboard,
        });
    }
    catch (error) {
        console.error('Ошибка при обработке изображения:', error);
        await ctx.reply('Извините, произошла ошибка при обработке вашего изображения. Пожалуйста, попробуйте еще раз позже.');
    }
    finally {
        // Reset waiting status
        ctx.session.waitingForCompletion = false;
        // Always show main keyboard after processing
        await ctx.reply("Что бы вы хотели сделать дальше?", {
            reply_markup: getMainKeyboard(),
        });
    }
});
// Handle inline keyboard callbacks
bot.callbackQuery("more_details", async (ctx) => {
    if (!isAllowedGroup(ctx))
        return;
    await ctx.answerCallbackQuery("Получение дополнительной информации...");
    await ctx.reply("Запрашиваю дополнительную информацию...");
    // Get the message that was replied to (which contains the image)
    const messageWithImage = ctx.callbackQuery.message?.reply_to_message;
    if (messageWithImage && 'photo' in messageWithImage) {
        // Process with a different prompt for more details
        await handleAIRequest(ctx, "Предоставь более подробный анализ изображения, включая мельчайшие детали и контекст");
    }
    else {
        await ctx.reply("Не могу найти оригинальное изображение для анализа.");
    }
});
bot.callbackQuery("translate", async (ctx) => {
    if (!isAllowedGroup(ctx))
        return;
    await ctx.answerCallbackQuery("Перевод контента...");
    await ctx.reply("Перевожу содержимое изображения на русский язык...");
    const messageWithImage = ctx.callbackQuery.message?.reply_to_message;
    if (messageWithImage && 'photo' in messageWithImage) {
        // Process with translation prompt
        await handleAIRequest(ctx, "Переведи весь текст на этом изображении на русский язык");
    }
    else {
        await ctx.reply("Не могу найти оригинальное изображение для перевода.");
    }
});
// Handle /ai command in groups and direct messages
bot.command('ai', async (ctx) => {
    // Skip if not allowed group
    if (!isAllowedGroup(ctx))
        return;
    const queryText = ctx.match;
    if (!queryText) {
        await ctx.reply('Пожалуйста, укажите запрос после команды /ai. Например: /ai Какая столица Франции?');
        return;
    }
    await handleAIRequest(ctx, queryText);
});
// Handler for AI requests
async function handleAIRequest(ctx, query) {
    if (ctx.session.waitingForCompletion) {
        await ctx.reply("Я все еще обрабатываю ваш предыдущий запрос. Пожалуйста, подождите.");
        return;
    }
    try {
        // Set waiting status
        ctx.session.waitingForCompletion = true;
        // Send typing indicator
        await ctx.api.sendChatAction(ctx.chat.id, "typing");
        // Notify user that we're processing
        const statusMsg = await ctx.reply("Обрабатываю ваш запрос...");
        // Call OpenRouter API
        const response = await callOpenRouterAPI(query);
        // Delete the status message
        await ctx.api.deleteMessage(ctx.chat.id, statusMsg.message_id);
        // Send the AI response
        await ctx.reply(response, {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            reply_markup: getMainKeyboard(),
        });
    }
    catch (error) {
        console.error('Ошибка при обработке запроса:', error);
        await ctx.reply('Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз позже.');
    }
    finally {
        // Reset waiting status
        ctx.session.waitingForCompletion = false;
    }
}
// Function to call OpenRouter API
async function callOpenRouterAPI(query) {
    try {
        // Add bot persona to query
        const contextualizedQuery = `[Ты ${BOT_NAME}, ИИ-ассистент на базе ${BOT_PLATFORM}, созданный компанией ${BOT_CREATOR}. Отвечай на русском языке. Всегда полезен и дружелюбен.]\n\nЗапрос пользователя: ${query}`;
        const response = await axios_1.default.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'meta-llama/llama-4-maverick:free',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: contextualizedQuery,
                        },
                    ],
                },
            ],
        }, {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': YOUR_SITE_URL,
                'X-Title': YOUR_SITE_NAME,
                'Content-Type': 'application/json',
            },
        });
        return response.data.choices[0].message.content || 'Нет ответа от ИИ';
    }
    catch (error) {
        console.error('Ошибка при вызове OpenRouter API:', error);
        throw new Error('Не удалось получить ответ от сервиса ИИ');
    }
}
// Function to call OpenRouter API with image
async function callOpenRouterAPIWithImage(query, imageUrl) {
    try {
        // Add bot persona to query
        const contextualizedQuery = `[Ты ${BOT_NAME}, ИИ-ассистент на базе ${BOT_PLATFORM}, созданный компанией ${BOT_CREATOR}. Отвечай на русском языке. Всегда полезен и дружелюбен.]\n\nПроанализируй это изображение. ${query}`;
        const response = await axios_1.default.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'meta-llama/llama-4-maverick:free',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: contextualizedQuery,
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageUrl
                            }
                        }
                    ],
                },
            ],
        }, {
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': YOUR_SITE_URL,
                'X-Title': YOUR_SITE_NAME,
                'Content-Type': 'application/json',
            },
        });
        return response.data.choices[0].message.content || 'Нет ответа от ИИ';
    }
    catch (error) {
        console.error('Ошибка при вызове OpenRouter API с изображением:', error);
        throw new Error('Не удалось получить ответ от сервиса ИИ для анализа изображения');
    }
}
// Start the bot
bot.start({
    onStart: (botInfo) => {
        console.log(`Бот @${botInfo.username} запущен!`);
        console.log(`${BOT_NAME} на базе ${BOT_PLATFORM}, создан компанией ${BOT_CREATOR}`);
        console.log(`Разрешенный ID группы: ${ALLOWED_GROUP_ID}`);
    },
});
// Error handling
process.on('uncaughtException', (error) => {
    console.error('Необработанное исключение:', error);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Необработанное отклонение:', promise, 'причина:', reason);
});
