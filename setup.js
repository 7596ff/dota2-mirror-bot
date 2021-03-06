const sqlite3 = require('sqlite3');
var config;

var db = new sqlite3.Database('users');

try {
    config = require('./config.js');
} catch (e) {
    console.log('Please fill out config.js.example and rename it to config.js!');
    console.log(e);
}

const fs = require('fs');

var str_config = JSON.stringify(config);

if (str_config) {
    fs.writeFile('config.json', str_config, (err) => {
        if (err) util.log(err);
        console.log('Config written! Start your both with node bot or pm2 start bot --name="mirrorbot".');
    });
}

// setup db
db.serialize(() => {
    db.run('CREATE TABLE users (discord_id TEXT primary key, dota_id TEXT)')
});

db.close();