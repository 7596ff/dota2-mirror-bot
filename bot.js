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

//sqlite3 stuff
const sqlite3 = require('sqlite3');

// load config
var config = require('./config.json');

// discord.js stuff
const Discord = require('discord.js');
const bot = new Discord.Client();
const token = config.discord_token;

// calculate battle pass level
var calcLevel = function(level) {
  if (level >= 60000) {
    return "<:trophy_4:251810862686273546>";
  } else if (level >= 40000) {
    return "<:trophy_3:251810862224900096>";
  } else if (level >= 20000) {
    return "<:trophy_2:251810861763526657>";
  } else if (level < 20000 && level > 100) {
    return "<:trophy_1:251810862161985536>";
  } else {
    return "";
  }
}

// sendmessage easier
var sendToDota = function (msg) {
  //var cache = Dota2._getChannelByName(config.bot_channel, config.bot_channel_type);
  //if (cache === undefined) gracefulRestart();
  Dota2.sendMessage(config.bot_channel, msg);
}

var sendToDiscord = function (msg) {
  bot.channels.get(config.discord_listen_channel).sendMessage(msg);
}

// do send message stuff
var dualMessage = function (msg) {
  sendToDiscord(msg);
  sendToDota(msg);
};

var gracefulRestart = function () {
  util.log('restarting.');
  dualMessage('Restarting.');
  setTimeout(function () { process.exit(); }, 2000);
};

var onSteamLogOn = function (logonResp) {
  if (logonResp.eresult == steam.EResult.OK) {
    steamFriends.setPersonaState(steam.EPersonaState.Busy);
    steamFriends.setPersonaName(global.steam_name);
    util.log('Logged on.');
    Dota2.launch();
    Dota2.on('ready', function () {
      // do chat logic

      Dota2.joinChat(config.bot_channel, config.bot_channel_type);

      util.log('Node-dota2 ready.');
      setTimeout(() => {
        sendToDota('Ready.');
        bot.channels.get(config.discord_listen_channel).sendMessage('Ready').then(message => {
          message.delete(10000);
        }).catch(err => console.log(err));
      }, 5000);
    });

    Dota2.on('unready', () => {
      util.log('Node-dota2 unready.');
      gracefulRestart();
    });

    Dota2.on('chatMessage', function (channel, personaName, message, chatObject) {
      util.log('message from dota: ' + personaName + ': ' + message);
      //console.log(JSON.stringify(chatObject));
      let victory = chatObject['battle_cup_victory'] ? '<:victory:251832934825328640>' : '';
      let level = calcLevel(chatObject['event_points']);

      if (chatObject['share_profile_account_id']) {
        sendToDiscord(`${level}${victory} **${personaName}:** My profile is: [${personaName}]`);
      } else if (chatObject['share_party_id']) {
        sendToDiscord(`${level}${victory} **${personaName}:** Join my party: [Join Party]`);
      } else if (chatObject['dice_roll']) {
        sendToDiscord(`${level}${victory} **${personaName}** rolls (${chatObject['dice_roll']['roll_min']}-${chatObject['dice_roll']['roll_max']}): ${chatObject['dice_roll']['result']}`);
      } else {
        sendToDiscord(`${level}${victory} **${personaName}:** ${message}`);
        if (message.match('!discord')) {
          dualMessage(global.discord_invite_link);
        }
      }
    });

    Dota2.on('unhandled', (kMsg) => {
      util.log('UNHANDLED MESSAGE' + kMsg);
    });

    Dota2.on('hellotimeout', () => {
      gracefulRestart();
    });

    bot.on('message', message => {
      if (message.channel.name == 'club-purple' && message.member.user.id != config.discord_self_id) {
        let nickname = message.member.nickname ? message.member.nickname : message.member.user.username;

        if (!message.content.startsWith('!')) {
          util.log('message from discord: ' + nickname + ': ' + message.cleanContent);
          sendToDota(nickname + ': ' + message.cleanContent);
        }

        if (message.content === "!restart") {
          gracefulRestart();
        }

        if (message.content.startsWith('!link')) {
          let dota_id = message.content.split(' ')[1];
          let discord_id = message.member.id;

          util.log(`linking discord user ${discord_id} with account id ${dota_id}`);

          if (isNaN(dota_id)) {
            message.channel.sendMessage('Please input a Dota ID (aka a number)!');
            return;
          }
          
          let db = new sqlite3.Database('users');
      
          db.serialize(() => {
            db.get(`SELECT * FROM users WHERE discord_id = ${discord_id};`, (err, result) => {
              if (err) console.log(err);

              if (dota_id > 2147483647) {
                message.channel.sendMessage('This ID is too long! Please copy your short ID (from your dota profile!)');
                db.close();
                return;
              }

              if (!result) {
                console.log('no results found with that id. adding to db.');
                message.channel.sendMessage('Registering Dota ID with your Discord account...').then(new_message => {
                  db.run(`INSERT INTO users VALUES('${discord_id}', '${dota_id}');`);
                  new_message.edit(`Registered Discord account \`${discord_id}\` with Dota ID \`${dota_id}\``);
                  db.close();
                }).catch(err => console.log(err));
              } else {
                console.log('a result was already found with that id, ' + JSON.stringify(result));
                message.channel.sendMessage('Updating your Discord account with a new Dota ID...').then(new_message => {
                  db.run(`UPDATE OR REPLACE users SET dota_id = ${dota_id} WHERE discord_id = ${discord_id}`);
                  new_message.edit(`Updated Discord account \`${discord_id}\` with Dota ID \`${dota_id}\``);
                  db.close();
                }).catch(err => console.log(err));
              }
            });
          });
        }

        if (message.content.startsWith('!info')) {
          let discord_id = message.member.id;
          let db = new sqlite3.Database('users');

          util.log(`checking stats on discord id ${discord_id}`);

          db.get(`SELECT * FROM users WHERE discord_id = ${discord_id}`, (err, result) => {
            if (err) console.log(err);
            console.log(result);  
            if (result == undefined) {
              message.channel.sendMessage('Please link your Dota account with the bot first! `!link <your dota id>`');
              return;
            } 
            
            let dota_id = result.dota_id;
            Dota2.requestPlayerStats(parseInt(dota_id), (acc_id, playerStats) => {
              let embed = { 'embed': 
                {
                  'color': '13512978',
                  'fields': [
                    {
                      'name': 'First Bloods',
                      'value': playerStats['first_blood_claimed'],
                      'inline': true
                    },
                    {
                      'name': 'Camps stacked',
                      'value': playerStats['creeps_stacked'],
                      'inline': true
                    },
                    {
                      'name': 'Couriers Killed', 
                      'value': playerStats['couriers_killed'],
                      'inline': true
                    },
                    {
                      'name': 'Aegis Steals',
                      'value': playerStats['aegises_snatched'],
                      'inline': true
                    },
                    {
                      'name': 'Triple Kills',
                      'value': playerStats['triple_kills'],
                      'inline': true
                    }, 
                    {
                      'name': 'Rampages',
                      'value': playerStats['rampages'],
                      'inline': true
                    }
                  ],
                  'timestamp': new Date().toJSON,
                  'footer': {
                    'icon_url': message.author.avatarURL,
                    'text': 'Lifetime stats for ' + nickname
                  }
                }
              }
              bot.channels.get(config.discord_listen_channel).sendMessage('', embed).then(message => {
                util.log('sent embed message');
              }).catch(err => console.log(err));
            });
          });

          db.close();
        }
      }
    });
  }
};

var onSteamServers = function (servers) {
  util.log('Recieved servers.');
  fs.writeFile('servers', JSON.stringify(servers), (err) => {
    if (err) throw err;
    util.log('wrote servers to file.');
  });
};

var onSteamLogOff = function (eresult) {
  util.log('Logged off from steam.');
};

<<<<<<< HEAD
var onSteamError = function(error) {
	util.log('Connection closed by server.');
	gracefulRestart();
<<<<<<< HEAD
=======
    util.log('Connection closed by server.');
>>>>>>> 0caa001... tabs to spaces
=======
>>>>>>> be02dc0... wahts hapepning
=======
var onSteamError = function (error) {
  util.log('Connection closed by server.');
  gracefulRestart();
>>>>>>> ef92438... ?
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