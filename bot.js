const http = require('http');
const express = require('express');
const app = express();
app.get("/", (request, response) => {
	console.log(Date.now() + " Ping Received");
	response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
	http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

//=============================================================================

const Discord = require('discord.js');
const bot = new Discord.Client();
const prefix = '$';

//donate
var moneyCount = 0;

//shotgun
var shotgunGameEnabled = false;
var shotgunTurnCounter = 0;
var playerName = null;
var playerHealth = 2;
var playerAmmo = 0;
var playerBlocked = false;
var botHealth = 2;
var botAmmo = 0;
var botBlocked = false;
var botMoveNum = -1;

bot.on('ready', () => {
    console.log('I am ready!');
});

bot.on('message', message => {
	if (message.author === bot.user) return;
	if (!message.content.startsWith(prefix)) return;
	
	var command = message.content.slice(1).toLowerCase();
	
	if (command === 'commands' || command === 'help'){
		message.reply("here is a list of commands: $commands, $help, $ping, $donate, $weather, $coinflip, $play/leave, $shotgun");
	}
	
	if (command === 'ping') {
		message.reply('pong');
	}
	
	if (command === 'donate') {
		moneyCount++;
		message.reply('thanks, I have $'+moneyCount+' now!');
	}
	
  if (command === 'weather'){
		message.channel.send('hot');
	}

  if (command === 'coinflip'){
    var randNum = Math.random();
    
    if (randNum < 0.50){
      message.channel.send('Heads.');
    } else {
      message.channel.send('Tails.');
		}
	}
  
  if (command.startsWith('play')){
    const channel = message.member.voiceChannel;

    channel.join()
    .then(connection => console.log('Connected!'))
    .catch(console.error);
    
    message.channel.send('not yet');
  }
  
  if (command === 'leave'){
    message.member.voiceChannel.leave();
    message.channel.send('bye');
  }
	
  
	//shotgun related stuff ===========================================================
	if (command === 'shotgun'){
		if (!shotgunGameEnabled){
			shotgunGameEnabled = true;
			playerName = message.author.username;
			message.channel.send("Your Health: "+playerHealth+",   Your Ammo: "+playerAmmo+",   My Health: "+botHealth+",   My Ammo: "+botAmmo);
			message.reply('select your move: $shoot, $reload, or $block? Or you can quit using $shotgunstop.');
		} else {
			message.reply('there is already a game in progress.');
		}
	}
	
	if (command === 'shotgunstop'){
		if (shotgunGameEnabled){
			shotgunStop();
			message.channel.send('Shotgun game ended.');
		} else {
			message.reply('there is no shotgun game in progress.');
		}
	}
	
	if (command === 'shoot'){
		if (shotgunGameEnabled){
			if (message.author.username === playerName){
				shotgunAISelectMove(playerAmmo, botAmmo);
				
				if (playerAmmo == 0){
					message.reply("you shoot!... but you have no ammo.");
				} else {
					if (botBlocked){
						message.reply("you shoot!... but I block this turn.");
					} else {
						botHealth--;
						message.reply("you shoot!... I lose some health.");
					}
					playerAmmo--;
				}
				
				shotgunAIPerformMove(botMoveNum, playerBlocked);
				shotgunResetBlocked();
				message.channel.send("Your Health: "+playerHealth+",   Your Ammo: "+playerAmmo+",   My Health: "+botHealth+",   My Ammo: "+botAmmo);
				if (shotgunCheckGameOver(playerHealth, botHealth)){
					if (playerHealth == 0 && botHealth == 0){
						message.reply("we killed each other! We both lose.");
					} else if (playerHealth == 0){
						message.reply("you lose!");
					} else {
						message.reply("you win!");
					}
					
					shotgunStop();
				}
			} else {
				message.reply("you're not "+playerName.avatar+"!");
			}
		} else {
			message.reply('there is no shotgun game in progress.');
		}
	}
	
	if (command === 'reload'){
		if (shotgunGameEnabled){
			if (message.author.username === playerName){
				shotgunAISelectMove(playerAmmo, botAmmo);
				
				playerAmmo++;
				message.reply("you load in a bullet.");
				
				shotgunAIPerformMove(botMoveNum, playerBlocked);
				shotgunResetBlocked();
				message.channel.send("Your Health: "+playerHealth+",   Your Ammo: "+playerAmmo+",   My Health: "+botHealth+",   My Ammo: "+botAmmo);
				if (shotgunCheckGameOver(playerHealth, botHealth)){
					if (playerHealth == 0 && botHealth == 0){
						message.reply("we killed each other! We both lose.");
					} else if (playerHealth == 0){
						message.reply("you lose!");
					} else {
						message.reply("you win!");
					}
					
					shotgunStop();
				}
			} else {
				message.reply("you're not "+playerName.avatar+"!");
			}
		} else {
			message.reply('there is no shotgun game in progress.');
		}
	}
	
	if (command === 'block'){
		if (shotgunGameEnabled){
			if (message.author.username === playerName){
				shotgunAISelectMove(playerAmmo, botAmmo);
				
				playerBlocked = true;
				message.reply("you block this turn.");
				
				shotgunAIPerformMove(botMoveNum, playerBlocked);
				shotgunResetBlocked();
				message.channel.send("Your Health: "+playerHealth+",   Your Ammo: "+playerAmmo+",   My Health: "+botHealth+",   My Ammo: "+botAmmo);
				if (shotgunCheckGameOver(playerHealth, botHealth)){
					if (playerHealth == 0 && botHealth == 0){
						message.reply("we killed each other! We both lose.");
					} else if (playerHealth == 0){
						message.reply("you lose!");
					} else {
						message.reply("you win!");
					}
					
					shotgunStop();
				}
			} else {
				message.reply("you're not "+playerName.avatar+"!");
			}
		} else {
			message.reply('there is no shotgun game in progress.');
		}
	}
	
	function shotgunAISelectMove(pAmmo, bAmmo){
		if (pAmmo == 0 && bAmmo == 0){
			botMoveNum = 1;
		} else if (bAmmo == 0){
			if (Math.random() < 0.5){
				botMoveNum = 2;
				shotgunAIBlock();
			} else {
				botMoveNum = 1;
			}
		} else if (pAmmo == 0){
			if (Math.random() < 0.5){
				botMoveNum = 0;
			} else {
				botMoveNum = 1;
			}
		} else if (bAmmo >= 2){
			if (Math.random() < 0.5){
				botMoveNum = 0;
			} else {
				botMoveNum = 2;
				shotgunAIBlock();
			}
		} else {
			if (Math.random() < 0.3333333333333333){
				botMoveNum = 0;
			} else if (Math.random() < 0.66666666666666666){
				botMoveNum = 1;
			} else {
				botMoveNum = 2;
				shotgunAIBlock();
			}
		}
	}
	
	function shotgunAIPerformMove(moveNum, pBlocked){
		if (moveNum == 0){
			shotgunAIShoot(pBlocked);
		} else if (moveNum == 1){
			shotgunAIReload();
		} else {
			// this is done earlier in selectMove
			//shotgunAIBlock();
		}
	}
	
	function shotgunAIShoot(pBlocked){
		if (pBlocked){
			message.channel.send("I shoot!... but you block my bullet.");
		} else {
			playerHealth--;
			message.channel.send("I shoot!... You lose some health.");
		}
		botAmmo--;
	}
	
	function shotgunAIReload(){
		botAmmo++;
		message.channel.send("I load in a bullet.");
	}
	
	function shotgunAIBlock(){
		botBlocked = true;
		message.channel.send("I block this turn.");
	}
	
	function shotgunResetBlocked(){
		playerBlocked = false;
		botBlocked = false;
	}
	
  function shotgunCheckGameOver(pHealth, bHealth){
		if (pHealth == 0 || bHealth == 0){
			return true;
		}
		return false;
	}
	
	function shotgunStop(){
		shotgunGameEnabled = false;
		shotgunTurnCounter = 0;
		playerName = null;
		playerHealth = 2;
		playerAmmo = 0;
		playerBlocked = false;
		botHealth = 2;
		botAmmo = 0;
		botBlocked = false;
		botMoveNum = -1;
	}
//=======================================================================================
	
});

bot.login(process.env.TOKEN);