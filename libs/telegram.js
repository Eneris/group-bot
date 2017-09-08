const config = require('../config.json')
const TelegramBot = require('tgfancy')

module.exports = new TelegramBot(
  process.env.TELEGRAM_TOKEN || config.TELEGRAM_TOKEN_TEST,
  {polling: true}
);