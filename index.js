const http = require("http");
const express = require("express");
const app = express();
const Discord = require("discord.js");
const fs = require("fs");

const botStartupTime = new Date();
const botStartupTimeAsLocaleString = botStartupTime.toLocaleString("en-US", {timeZone: "America/Los_Angeles",});
console.log("*****");
console.log("*****");
console.log("Starting up bot at " + botStartupTimeAsLocaleString + " PT...");

app.get("/", (request, response) => {
	console.log(Date.now() + " Ping Received");
	response.sendStatus(200);
});

app.listen(process.env.PORT);
setInterval(() => {
	http.get("http://" + process.env.PROJECT_DOMAIN + ".glitch.me/");
}, 280000);

//============           VARIABLES           ====================================

// bot variables
const { prefix, globalCooldownAmount } = require("./config.json");
const client = new Discord.Client();

// donate variables
client.moneyCount = 0;

// shotgun variables
client.shotgunGameEnabled = false;
client.shotgunTurnCounter = 0;
client.playerName = null;
client.playerHealth = 2;
client.playerAmmo = 0;
client.playerBlocked = false;
client.botHealth = 2;
client.botAmmo = 0;
client.botBlocked = false;
client.botMoveNum = -1;

// uptime variables
client.botIsLiveTime; // ms of time of bot going live

//==============            "FUNCTIONS"           ===================================

// Creates commands based on .js file names in ./commands folder
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
	const command = require("./commands/" + file);

	// set a new item in the Collection
	// with the key as the command name and the value as the exported module
	client.commands.set(command.name, command);
}

// Create a cooldowns collection for commands
const cooldowns = new Discord.Collection();



// Triggers when the bot is live
client.once("ready", () => {
	client.botIsLiveTime = new Date();
	var botIsLiveTimeAsLocaleString = client.botIsLiveTime.toLocaleString("en-US", {timeZone: "America/Los_Angeles",});
    console.log("I am ready! Live as of " + botIsLiveTimeAsLocaleString + " PT.");
});

// Triggers on error 
client.on("error", (err) => {
  	console.error("Bot error:");
  	console.error(err);
});

client.on("message", message => {	
	// If the message author is a bot or if the message doesn't start with the prefix, then stop
	if (message.author.bot || !message.content.startsWith(prefix)){
		return;
	}

	// Splits users arguments after prefix
	const arguments = message.content.slice(prefix.length).trim().split(/ +/);

	// Gets first word after prefix using the arguments array
	const commandName = arguments.shift().toLowerCase();
	
	// Create the command, checking aliases as well. But if the command doesn't exist, then stop
	const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	if (!command){
		return;
	}

	// Check if a command can only be used in a server (and not a DM)
	if (command.guildOnly && message.channel.type === "dm") {
		return message.reply("You cannot execute that command inside DMs.");
	}

	
	// Check cooldown of command of user
	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || globalCooldownAmount) * 1000; // If command doesn't have a cooldown, set it to the globalCooldownAmount instead

	if (timestamps.has(message.author.id)) {
		const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			return message.channel.send("Please wait " + timeLeft.toFixed(1) + " more second(s) before reusing the `" + command.name + "` command.");
		}
	}

	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);


	// Argument check, and show usage if it exists
	if (command.arguments && !arguments.length) {
		let reply = "You didn't provide any arguments, " + message.author + "!";

		if(command.usage){
			reply += "\nThe proper usage would be: `" + prefix + command.name + " " + command.usage + "`";
		}

		return message.channel.send(reply);
	}

	
	// Execute the command
	try {
		command.execute(message, arguments);
	} catch (error) {
		console.error(error);
		message.reply("there was an error trying to execute that command!");
	}











	
	//shotgun related stuff ===========================================================
	if (commandName === "shotgun" || commandName === "sg"){
		if (!shotgunGameEnabled){
			shotgunGameEnabled = true;
			playerName = message.author.username;
			message.channel.send("Your Health: " + playerHealth + ",   Your Ammo: " + playerAmmo + "\nMy Health: " + botHealth + ",      My Ammo: " + botAmmo + "\nSelect your move: `" + prefix + "shoot`, `" + prefix + "reload`, or `" + prefix + "block`? Or you can quit using `" + prefix + "shotgunstop`.");
		} else {
			message.channel.send("There is already a game in progress.");
		}
	}
	
	if (commandName === "shotgunstop" || commandName === "sgstop"){
		if (shotgunGameEnabled){
			shotgunStop();
			message.channel.send("Shotgun game stopped.");
		} else {
			message.channel.send("There is no shotgun game in progress.");
		}
	}
	
	if (commandName === "shoot"){
		if (shotgunGameEnabled){
			if (message.author.username === playerName){
				shotgunAISelectMove(playerAmmo, botAmmo);
				
				if (playerAmmo == 0){
					message.channel.send("you shoot!... but you have no ammo.");
				} else {
					if (botBlocked){
						message.channel.send("you shoot!... but I blocked this turn.");
					} else {
						botHealth--;
						message.channel.send("you shoot!... and it hits! I lose some health.");
					}
					playerAmmo--;
				}
				
				shotgunAIPerformMove(botMoveNum, playerBlocked);
				shotgunResetBlocked();
				message.channel.send("Your Health: "+playerHealth+",   Your Ammo: "+playerAmmo+",   My Health: "+botHealth+",   My Ammo: "+botAmmo);
				if (shotgunCheckGameOver(playerHealth, botHealth)){
					if (playerHealth == 0 && botHealth == 0){
						message.channel.send("We killed each other! We both lose.");
					} else if (playerHealth == 0){
						message.channel.send("You lose!");
					} else {
						message.channel.send("You win!");
					}
					
					shotgunStop();
				}
			} else {
				message.channel.send("you're not "+playerName.avatar+"!");
			}
		} else {
			message.channel.send("there is no shotgun game in progress.");
		}
	}
	
	if (commandName === "reload"){
		if (shotgunGameEnabled){
			if (message.author.username === playerName){
				shotgunAISelectMove(playerAmmo, botAmmo);
				
				playerAmmo++;
				message.channel.send("You load a bullet.");
				
				shotgunAIPerformMove(botMoveNum, playerBlocked);
				shotgunResetBlocked();
				message.channel.send("Your Health: "+playerHealth+",   Your Ammo: "+playerAmmo+",   My Health: "+botHealth+",   My Ammo: "+botAmmo);
				if (shotgunCheckGameOver(playerHealth, botHealth)){
					if (playerHealth == 0 && botHealth == 0){
						message.channel.send("We killed each other! We both lose.");
					} else if (playerHealth == 0){
						message.channel.send("You lose!");
					} else {
						message.channel.send("You win!");
					}
					
					shotgunStop();
				}
			} else {
				message.channel.send("You're not "+playerName.avatar+"!");
			}
		} else {
			message.channel.send("There is no shotgun game in progress.");
		}
	}
	
	if (commandName === "block"){
		if (shotgunGameEnabled){
			if (message.author.username === playerName){
				shotgunAISelectMove(playerAmmo, botAmmo);
				
				playerBlocked = true;
				message.channel.send("You block this turn.");
				
				shotgunAIPerformMove(botMoveNum, playerBlocked);
				shotgunResetBlocked();
				message.channel.send("Your Health: "+playerHealth+",   Your Ammo: "+playerAmmo+",   My Health: "+botHealth+",   My Ammo: "+botAmmo);
				if (shotgunCheckGameOver(playerHealth, botHealth)){
					if (playerHealth == 0 && botHealth == 0){
						message.channel.send("We killed each other! We both lose.");
					} else if (playerHealth == 0){
						message.channel.send("You lose!");
					} else {
						message.channel.send("You win!");
					}
					
					shotgunStop();
				}
			} else {
				message.channel.send("You're not "+playerName.avatar+"!");
			}
		} else {
			message.channel.send("There is no shotgun game in progress.");
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
			message.channel.send("I shoot!... but you blocked my bullet.");
		} else {
			playerHealth--;
			message.channel.send("I shoot!... and it hits! You lost some health.");
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
});

//============          "MAIN FUNCTION"             ======================================

const botLoginTime = new Date();
const botLoginTimeAsLocaleString = botLoginTime.toLocaleString("en-US", {timeZone: "America/Los_Angeles",});
console.log("Attempting bot login at " + botLoginTimeAsLocaleString + " PT...");
client.login(process.env.TOKEN).catch(console.error);