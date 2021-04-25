const TelegramBot = require('node-telegram-bot-api');
const token = 'ваш телеграм токен';
const SteamTotp = require('steam-totp');
const fs = require('fs');
const config = require('./config.js');
const bot = new TelegramBot(token, {polling: true});

bot.on('message', async(msg) => {
    try{
        reply(msg);
    } catch (err){
        console.log("Произошла ошибка при ответе: " + err);
    }
});

function reply(msg){
    const chatId = msg.chat.id;
    var command = msg.text.split(' ')[0];
    var tokens = JSON.parse(fs.readFileSync('tokens.json', 'utf8'));
    var username = msg.from.username;
    if (tokens[username] == undefined){
        bot.sendMessage(chatId, "У вас нет доступа!");
        return;
    }
    var date = new Date();
    var date_str = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    console.log(`${date_str} ${username}: ${msg.text}`);
    switch (command.toLowerCase()){
        case "/help":
            bot.sendMessage(chatId, config.help);
            break;
        case "/token":
            var login = msg.text.split(' ')[1];
            if (login == undefined){
                bot.sendMessage(chatId, "Не указан логин аккаунта");
                return;
            }
            if (tokens[username][login] == undefined){
                bot.sendMessage(chatId, "Аккаунта с таким логином нет в системе");
                return;
            }
            var shared = tokens[username][login].shared;
            if (shared != undefined){
                var code = SteamTotp.generateAuthCode(shared);
                bot.sendMessage(chatId, code);
            } else {
                bot.sendMessage(chatId, "Нет такого логина!");
            }
            break;
        case "/comment":
            var login = msg.text.split(' ')[1];
            var text = msg.text.slice(("/comment  " + login).length, msg.text.length);
            if (tokens[username][login] != undefined){
                tokens[username][login].description = text;
                console.log(text);
                fs.writeFileSync('tokens.json', JSON.stringify(tokens));
                bot.sendMessage(chatId, "Описание сохранено");
            } else {
                bot.sendMessage(chatId, "Нет такого аккаунта!");
            }
            break;
        case "/accounts":
            var s = "Ваши аккаунты: \n";
            for (i in tokens[username]){
                s+= i + "\n";
            }
            bot.sendMessage(chatId, s);
            break;
        default:
            bot.sendMessage(chatId, "Неизвестная команда! Пиши /help чтобы посмотреть список всех команд");
    }
}
