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
global.config = require('./config');

// discord.js stuff
const Discord = require('discord.js');
const bot = new Discord.Client();
const token = global.config.discord_token;

// sendmessage easier
var sendToDota = function(msg) {
    Dota2.sendMessage(global.config.bot_channel, msg, global.config.bot_channel_type);
}

// do send message stuff
var dualMessage = function(msg) {
    bot.channels.get(global.config.discord_listen_channel).sendMessage('`' + msg + '`');
    sendToDota(msg);
};

var gracefulRestart = function() {
    console.log('restarting.');
    dualMessage('Restarting.');
    setTimeout(function() {process.exit();}, 2000);
}

var discordParseEmoji = function(message) {

};

var onSteamLogOn = function onSteamLogOn(logonResp) {
    if (logonResp.eresult == steam.EResult.OK) {
        steamFriends.setPersonaState(steam.EPersonaState.Busy);
        steamFriends.setPersonaName(global.steam_name);
        util.log('Logged on.');
        Dota2.launch();
        Dota2.on('ready', function() {
            // do chat logic

            Dota2.joinChat(global.config.bot_channel, global.config.bot_channel_type);

            console.log('Node-dota2 ready.');
        });

        Dota2.on('unready', function onUnready() {
            console.log('Node-dota2 unready.');
        });
        Dota2.on('chatMessage', function(channel, personaName, message) {
            console.log('message from dota: ' + personaName + ': ' + message);
            bot.channels.get(global.config.discord_listen_channel).sendMessage('**' + personaName + ':** ' + message);
        });
        Dota2.on('unhandled', function(kMsg) {
            util.log('UNHANDLED MESSAGE' + kMsg);
        });

        Dota2.on('hellotimeout', function() {
            gracefulRestart();
        });

        bot.on('message', message => {
            if (message.channel.name == 'club-purple' && message.member.user.id != global.config.discord_self_id) {
                console.log('message from discord: ' + message.member.user.username + ': ' + message.content);
                sendToDota(message.member.user.username + ': ' + message.content);

                if (message.content === "!restart") {
                    gracefulRestart();
                }
            }
        });
    }
};

var onSteamServers = function onSteamServers(servers) {
    util.log('Recieved servers.');
    fs.writeFile('servers', JSON.stringify(servers));
};

var onSteamLogOff = function onSteamLogOff(eresult) {
    util.log('Logged off from steam.');
};

var onSteamError = function onSteamError(error) {
	util.log('Connection closed by server.');
	gracefulRestart();
<<<<<<< HEAD
=======
    util.log('Connection closed by server.');
>>>>>>> 0caa001... tabs to spaces
=======
>>>>>>> be02dc0... wahts hapepning
};

steamUser.on('updateMachineAuth', function(sentry, callback) {
    var hashedSentry = crypto.createHash('sha1').update(sentry.bytes).digest();
    fs.writeFileSync('sentry', hashedSentry)
    util.log("sentryfile saved");
    callback({
        sha_file: hashedSentry
    });
});

// discord
bot.on('ready', () => {
    console.log('discord ready.');
});

// log in, no auth code needed
var logOnDetails = {
    "account_name": global.config.steam_user,
    "password": global.config.steam_pass,
};

if (global.config.steam_guard_code) {
    logOnDetails.auth_code = global.config.steam_guard_code;
}

try {
    var sentry = fs.readFileSync('sentry');
    if (sentry.length) logOnDetails.sha_sentryfile = sentry;
} catch (beef) {
    util.log("Cannae load the sentry. " + beef);
}

steamClient.connect();
steamClient.on('connected', function() {
    steamUser.logOn(logOnDetails);
});
steamClient.on('logOnResponse', onSteamLogOn);
steamClient.on('loggedOff', onSteamLogOff);
steamClient.on('error', onSteamError);
steamClient.on('servers', onSteamServers);

bot.login(token);