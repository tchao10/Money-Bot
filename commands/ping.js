const Discord = require("discord.js");

module.exports = {
	name: "ping",
	description: "pong",
	usage: "",
	aliases: [],
	arguments: false,
	guildOnly: false,
	execute(message, arguments){
		message.reply("pong");

		const exampleEmbed = new Discord.MessageEmbed()
			.setColor("#0099ff")
			.setTitle("Shotgun")
			.setDescription("Some description here")
			.setThumbnail("https://cdn.discordapp.com/avatars/374095302648659980/3953362a62cb6a1bdce66f13a31aef4a.png")
			.addFields(
				{ name: "Regular field title", value: "Some value here" },
				{ name: "\u200B", value: "\u200B" },
				{ name: "Inline field title", value: "Some value here", inline: true },
				{ name: "Inline field title", value: "Some value here", inline: true },
			)
			.addField("Inline field title", "Some value here", true)
			.setImage("https://i.imgur.com/wSTFkRM.png")
			.setTimestamp()

		message.channel.send(exampleEmbed);
	},
};