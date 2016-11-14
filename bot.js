// node-dota2 stuff
var steam = require('steam'),
    util = require('util'),
    fs = require('fs'),
    crypto = require('crypto'),
    dota2 = require('dota2');

var steamClient = new steam.SteamClient(),
    steamUser = new steam.SteamUser(steamClient),
    steamFriends = new steam.SteamFriends(steamClient),
    Dota2 = new dota2.Dota2Client(steamClient, true, true);

// load config
var config = require('./config.json');

// discord.js stuff
const Discord = require('discord.js');
const bot = new Discord.Client();
const token = config.discord_token;

// sendmessage easier
var sendToDota = function(msg) {
    Dota2.sendMessage(config.bot_channel, msg, config.bot_channel_type);
}

// do send message stuff
var dualMessage = function(msg) {
    bot.channels.get(config.discord_listen_channel).sendMessage('`' + msg + '`');
    sendToDota(msg);
};

var gracefulRestart = function() {
    util.log('restarting.');
    dualMessage('Restarting.');
    setTimeout(function() {process.exit();}, 2000);
};

var onSteamLogOn = function(logonResp) {
    if (logonResp.eresult == steam.EResult.OK) {
        steamFriends.setPersonaState(steam.EPersonaState.Busy);
        steamFriends.setPersonaName(global.steam_name);
        util.log('Logged on.');
        Dota2.launch();
        Dota2.on('ready', function() {
            // do chat logic

            Dota2.joinChat(config.bot_channel, config.bot_channel_type);

            util.log('Node-dota2 ready.');
        });

        Dota2.on('unready', () => {
            util.log('Node-dota2 unready.');
        });

        Dota2.on('chatMessage', function(channel, personaName, message) {
            util.log('message from dota: ' + personaName + ': ' + message);
            bot.channels.get(config.discord_listen_channel).sendMessage('**' + personaName + ':** ' + message);
        });

        Dota2.on('unhandled', (kMsg) => {
            util.log('UNHANDLED MESSAGE' + kMsg);
        });

        Dota2.on('hellotimeout', () => {
            gracefulRestart();
        });

        bot.on('message', message => {
            if (message.channel.name == 'club-purple' && message.member.user.id != config.discord_self_id) {
                let nickname = message.member.user.username;
                if (message.member.nickname != null) nickname = message.member.nickname;
                util.log('message from discord: ' + nickname + ': ' + message.content);
                sendToDota(nickname + ': ' + message.content);

                if (message.content === "!restart") {
                    gracefulRestart();
                }
            }
        });
    }
};

var onSteamServers = function(servers) {
    util.log('Recieved servers.');
    fs.writeFile('servers', JSON.stringify(servers), (err) => {
        if (err) throw err;
        util.log('wrote servers to file.');
    });
};

var onSteamLogOff = function(eresult) {
    util.log('Logged off from steam.');
};

var onSteamError = function(error) {
	util.log('Connection closed by server.');
	gracefulRestart();
<<<<<<< HEAD
=======
    util.log('Connection closed by server.');
>>>>>>> 0caa001... tabs to spaces
=======
>>>>>>> be02dc0... wahts hapepning
};

steamUser.on('updateMachineAuth', (sentry, callback) => {
    var hashedSentry = crypto.createHash('sha1').update(sentry.bytes).digest();
    fs.writeFileSync('sentry', hashedSentry)
    util.log("sentryfile saved");
    callback({
        sha_file: hashedSentry
    });
});

// discord
bot.on('ready', () => {
    util.log('discord ready.');
});

// log in, no auth code needed
var logOnDetails = {
    "account_name": config.steam_user,
    "password": config.steam_pass,
};

if (config.steam_guard_code) logOnDetails.auth_code = config.steam_guard_code;

try {
    var sentry = fs.readFileSync('sentry');
    if (sentry.length) logOnDetails.sha_sentryfile = sentry;
} catch (beef) {
    util.log("Cannae load the sentry. " + beef);
}

steamClient.connect();
steamClient.on('connected', () => {
    steamUser.logOn(logOnDetails);
});
steamClient.on('logOnResponse', onSteamLogOn);
steamClient.on('loggedOff', onSteamLogOff);
steamClient.on('error', onSteamError);
steamClient.on('servers', onSteamServers);

bot.login(token);