const { prefix } = require("../config.json");

module.exports = {
	name: "shotgun",
	description: "Plays a shotgun game.",
	usage: "[start/stop/shoot/reload/block/help]",
	aliases: ["sg"],
	arguments: false,
	guildOnly: false,
	execute(message, arguments){
		//console.log(typeof message);
		//console.log("~\n~\n~\n~\n~\n~\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
		//console.log(message.client);
		//console.log("@\n@\n@\n@\n@\n@\n@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@");

		// Start a game
		if (arguments[0] == "start"){
			if (!message.client.shotgunGameEnabled){
				message.client.shotgunGameEnabled = true;
				message.client.playerName = message.author.username;
				message.channel.send("Your Health: " + message.client.playerHealth + ",   Your Ammo: " + message.client.playerAmmo + "\nMy Health: " + message.client.botHealth + ",      My Ammo: " + message.client.botAmmo + "\nSelect your move: `" + prefix + "shoot`, `" + prefix + "reload`, or `" + prefix + "block`? Or you can quit using `" + prefix + "shotgunstop`.");
			} else {
				message.channel.send("There is already a game in progress.");
			}

			return;
		}

		// Stop a game
		if (arguments[0] == "stop"){
			if (message.client.shotgunGameEnabled){
				shotgunStop(message);
				message.channel.send("Shotgun game stopped.");
			} else {
				message.channel.send("There is no shotgun game in progress.");
			}

			return;
		}

		// Player shoots
		if (arguments[0] == "shoot"){
			if (message.client.shotgunGameEnabled){
				if (message.author.username === message.client.playerName){
					shotgunAISelectMove(message);
					
					if (message.client.playerAmmo == 0){
						message.channel.send("You shoot!... but you have no ammo.");
					} else {
						if (message.client.botBlocked){
							message.channel.send("You shoot!... but I blocked this turn.");
						} else {
							message.client.botHealth--;
							message.channel.send("You shoot!... and it hits! I lose some health.");
						}
						message.client.playerAmmo--;
					}
					
					shotgunAIPerformMove(message);
					shotgunResetBlocked(message);
					message.channel.send("Your Health: " + message.client.playerHealth + ",   Your Ammo: " + message.client.playerAmmo + "\nMy Health: " + message.client.botHealth + ",      My Ammo: " + message.client.botAmmo);
					if (shotgunCheckGameOver(message.client.playerHealth, message.client.botHealth)){
						if (message.client.playerHealth == 0 && message.client.botHealth == 0){
							message.channel.send("We killed each other! We both lose.");
						} else if (message.client.playerHealth == 0){
							message.channel.send("You lose!");
						} else {
							message.channel.send("You win!");
						}
						
						shotgunStop(message);
					}
				} else {
					message.channel.send("you're not "+message.client.playerName.avatar+"!");
				}
			} else {
				message.channel.send("there is no shotgun game in progress.");
			}

			return;
		}

		// Player reloads
		if (arguments[0] == "reload"){
			if (message.client.shotgunGameEnabled){
				if (message.author.username === message.client.playerName){
					shotgunAISelectMove(message);
					
					message.client.playerAmmo++;
					message.channel.send("You load a bullet.");
					
					shotgunAIPerformMove(message);
					shotgunResetBlocked(message);
					message.channel.send("Your Health: " + message.client.playerHealth + ",   Your Ammo: " + message.client.playerAmmo + "\nMy Health: " + message.client.botHealth + ",      My Ammo: " + message.client.botAmmo);
					if (shotgunCheckGameOver(message.client.playerHealth, message.client.botHealth)){
						if (message.client.playerHealth == 0 && message.client.botHealth == 0){
							message.channel.send("We killed each other! We both lose.");
						} else if (message.client.playerHealth == 0){
							message.channel.send("You lose!");
						} else {
							message.channel.send("You win!");
						}
						
						shotgunStop(message);
					}
				} else {
					message.channel.send("You're not "+message.client.playerName.avatar+"!");
				}
			} else {
				message.channel.send("There is no shotgun game in progress.");
			}

			return;
		}

		// Player blocks
		if (arguments[0] == "block"){
			if (message.client.shotgunGameEnabled){
				if (message.author.username === message.client.playerName){
					shotgunAISelectMove(message);
					
					message.client.playerBlocked = true;
					message.channel.send("You block this turn.");
					
					shotgunAIPerformMove(message);
					shotgunResetBlocked(message);
					message.channel.send("Your Health: " + message.client.playerHealth + ",   Your Ammo: " + message.client.playerAmmo + "\nMy Health: " + message.client.botHealth + ",      My Ammo: " + message.client.botAmmo);
					if (shotgunCheckGameOver(message.client.playerHealth, message.client.botHealth)){
						if (message.client.playerHealth == 0 && message.client.botHealth == 0){
							message.channel.send("We killed each other! We both lose.");
						} else if (message.client.playerHealth == 0){
							message.channel.send("You lose!");
						} else {
							message.channel.send("You win!");
						}
						
						shotgunStop(message);
					}
				} else {
					message.channel.send("You're not "+message.client.playerName.avatar+"!");
				}
			} else {
				message.channel.send("There is no shotgun game in progress.");
			}

			return;
		}

		// Display help message in every other case
		return message.channel.send("help explanation goes here");
	},
};

function shotgunAISelectMove(message){
	const pAmmo = message.client.playerAmmo;
	const bAmmo = message.client.botAmmo;

	if (pAmmo == 0 && bAmmo == 0){
		message.client.botMoveNum = 1;
	} else if (bAmmo == 0){
		if (Math.random() < 0.5){
			message.client.botMoveNum = 2;
			shotgunAIBlock(message);
		} else {
			message.client.botMoveNum = 1;
		}
	} else if (pAmmo == 0){
		if (Math.random() < 0.5){
			message.client.botMoveNum = 0;
		} else {
			message.client.botMoveNum = 1;
		}
	} else if (bAmmo >= 2){
		if (Math.random() < 0.5){
			message.client.botMoveNum = 0;
		} else {
			message.client.botMoveNum = 2;
			shotgunAIBlock(message);
		}
	} else {
		if (Math.random() < 0.3333333333333333){
			message.client.botMoveNum = 0;
		} else if (Math.random() < 0.66666666666666666){
			message.client.botMoveNum = 1;
		} else {
			message.client.botMoveNum = 2;
			shotgunAIBlock(message);
		}
	}
}

function shotgunAIPerformMove(message){
	const moveNum = message.client.botMoveNum;
	const pBlocked = message.client.playerBlocked;

	if (moveNum == 0){
		shotgunAIShoot(pBlocked);
	} else if (moveNum == 1){
		shotgunAIReload(message);
	} else {
		// this is done earlier in selectMove
		//shotgunAIBlock(message);
	}
}

function shotgunAIShoot(message){
	console.log(message);
	console.log(message.client);
	const pBlocked = message.client.playerBlocked;

	if (pBlocked){
		message.channel.send("I shoot!... but you blocked my bullet.");
	} else {
		message.client.playerHealth--;
		message.channel.send("I shoot!... and it hits! You lose some health.");
	}
	message.client.botAmmo--;
}

function shotgunAIReload(message){
	message.client.botAmmo++;
	message.channel.send("I load in a bullet.");
}

function shotgunAIBlock(message){
	message.client.botBlocked = true;
	message.channel.send("I block this turn.");
}

function shotgunResetBlocked(message){
	message.client.playerBlocked = false;
	message.client.botBlocked = false;
}

function shotgunCheckGameOver(pHealth, bHealth){
	return (pHealth == 0 || bHealth == 0);
}

function shotgunStop(message){
	message.client.shotgunGameEnabled = false;
	message.client.shotgunTurnCounter = 0;
	message.client.playerName = null;
	message.client.playerHealth = 2;
	message.client.playerAmmo = 0;
	message.client.playerBlocked = false;
	message.client.botHealth = 2;
	message.client.botAmmo = 0;
	message.client.botBlocked = false;
	message.client.botMoveNum = -1;
}