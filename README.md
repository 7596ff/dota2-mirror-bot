##dota2-mirror-bot

a quick bot that mirrors text content between a discord chat channel and a dota channel.

to run for yourself a bunch of steps need to be taken:

1. create a discord application [here](https://discordapp.com/developers/applications/me)
1. create a steam account to use as the in game bot 

 on initial creation, the steam account will not be able to talk in public chat channels. from here you have two choices. you can either play enough games to get to level 5 in dota or you can spend five dollars on steam. if you don't want to play dumb smurf games i recommend [golf with your friends](http://store.steampowered.com/app/431240/). its six dollars so it will activate your account, and it's pretty fun too. 

1. install packages by running `npm install steam` (to work around [#222](https://github.com/seishun/node-steam/issues/222)) and then `npm install`

1. edit config.example and add all your information. rename as config.js.

1. use `https://discordapp.com/oauth2/authorize?client_id=CLIENT_ID_GOES_HERE&scope=bot&permissions=0` to add your discord bot to your server. 

1. install forever with `npm install forever -g`

1. run the bot with forever start bot.js. this will start the bot as a daemon, and it is written to restart itself when the dota 2 GC goes down. 

features coming later include refactoring the code to make it neater, and using forever-monitor instead of forever to make it self-aware(?)
