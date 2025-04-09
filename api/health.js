// Эндпоинт для проверки состояния бота

export default function handler(req, res) {
  console.log('Запрос на /api/health');
  
  // Возвращаем информацию о состоянии бота
  res.status(200).json({
    status: 'ok',
    bot_name: 'ARK-1',
    platform: 'PLEXY',
    creator: '@samgay_nis',
    webhook_url: process.env.WEBHOOK_URL || 'не указан',
    last_check: new Date().toISOString()
  });
} 