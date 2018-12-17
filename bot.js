const Discord = require("discord.js");
const ytdl = require("ytdl-core");
const { Client, Util } = require('discord.js');
const getYoutubeID = require('get-youtube-id');
const fetchVideoInfo = require('youtube-info');
const YouTube = require('simple-youtube-api');
const youtube = new YouTube("AIzaSyAdORXg7UZUo7sePv97JyoDqtQVi3Ll0b8");
const queue = new Map();
const client = new Discord.Client();

const prefix = "1";
client.on('message', async msg => { // eslint-disable-line
	if (msg.author.bot) return undefined;
	
	if (!msg.content.startsWith(prefix)) return undefined;
	const args = msg.content.split(' ');
	const searchString = args.slice(1).join(' ');
	
	const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';
	const serverQueue = queue.get(msg.guild.id);

	let command = msg.content.toLowerCase().split(" ")[0];
	command = command.slice(prefix.length);

	if (command === `play`) {

		const voiceChannel = msg.member.voiceChannel;
		if (!voiceChannel) return msg.channel.send('íÌÈ ÊæÂÌÏ ÍÖÑÊß ÈÑæã ÕæÊí .');
		const permissions = voiceChannel.permissionsFor(msg.client.user);
		if (!permissions.has('CONNECT')) {
			
			return msg.channel.send('áÇ íÊæÂÌÏ áÏí ÕáÇÍíÉ ááÊßáã ÈåÐÂ ÇáÑæã');
		}
		if (!permissions.has('SPEAK')) {
			return msg.channel.send('áÇ íÊæÂÌÏ áÏí ÕáÇÍíÉ ááÊßáã ÈåÐÂ ÇáÑæã');
		}

		if (!permissions.has('EMBED_LINKS')) {
			return msg.channel.sendMessage("**íÌÈ ÊæÂÝÑ ÈÑãÔä `EMBED LINKS`áÏí **");
		}

		if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
			const playlist = await youtube.getPlaylist(url);
			const videos = await playlist.getVideos();
			
			for (const video of Object.values(videos)) {
				const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
				await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
			}
			return msg.channel.send(` **${playlist.title}** Êã ÇáÅÖÂÝÉ Åáì ÞÃÆãÉ ÇáÊÔÛíá`);
		} else {
			try {

				var video = await youtube.getVideo(url);
			} catch (error) {
				try {
					var videos = await youtube.searchVideos(searchString, 5);
					let index = 0;
					const embed1 = new Discord.RichEmbed()
			        .setDescription(`**ÇáÑÌÂÁ ãä ÍÖÑÊß ÅÎÊíÂÑ ÑÞã ÇáãÞØÚ** :
${videos.map(video2 => `[**${++index} **] \`${video2.title}\``).join('\n')}`)

					.setFooter("Ninja");
					msg.channel.sendEmbed(embed1).then(message =>{message.delete(20000)});
					
					// eslint-disable-next-line max-depth
					try {
						var response = await msg.channel.awaitMessages(msg2 => msg2.content > 0 && msg2.content < 11, {
							maxMatches: 1,
							time: 15000,
							errors: ['time']
						});
					} catch (err) {
						console.error(err);
						return msg.channel.send('áã íÊã ÅÎÊíÂÑ ãÞØÚ ÕæÊí');
					}
					const videoIndex = parseInt(response.first().content);
					var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
				} catch (err) {
					console.error(err);
					return msg.channel.send(':X: áÇ íÊæÝÑ äÊÂÆÌ ÈÍË ');
				}
			}

			return handleVideo(video, msg, voiceChannel);
		}
	} else if (command === `s`) {

		if (!msg.member.voiceChannel) return msg.channel.send('ÃäÊ áÓÊ ÈÑæã ÕæÊí .');
		if (!serverQueue) return msg.channel.send('áÇ íÊæÝÑ ãÞØÚ áÊÌÂæÒå');
		serverQueue.connection.dispatcher.end('Êã ÊÌÂæÒ åÐÂ ÇáãÞØÚ');
		return undefined;
	} else if (command === `join`) {

		if (!msg.member.voiceChannel) return msg.channel.send('ÃäÊ áÓÊ ÈÑæã ÕæÊí .');
		msg.member.voiceChannel.join();
		return undefined;
	} else if (command === `stop`) {

		if (!msg.member.voiceChannel) return msg.channel.send('ÃäÊ áÓÊ ÈÑæã ÕæÊí .');
		if (!serverQueue) return msg.guild.member(client).voiceChannel.leave();
		serverQueue.songs = [];
		serverQueue.connection.dispatcher.end('Êã ÅíÞÂÝ åÐÂ ÇáãÞØÚ');
		return undefined;
	} else if (command === `vol`) {

		if (!msg.member.voiceChannel) return msg.channel.send('ÃäÊ áÓÊ ÈÑæã ÕæÊí .');
		if (!serverQueue) return msg.channel.send('áÇ íæÌÏ ÔíÁ ÔÛÂá.');
		if (!args[1]) return msg.channel.send(`:loud_sound: ãÓÊæì ÇáÕæÊ **${serverQueue.volume}**`);
		serverQueue.volume = args[1];
		serverQueue.connection.dispatcher.setVolumeLogarithmic(args[1] / 50);
		return msg.channel.send(`:speaker: Êã ÊÛíÑ ÇáÕæÊ Çáí **${args[1]}**`);
	} else if (command === `np`) {

		if (!serverQueue) return msg.channel.send('áÇ íæÌÏ ÔíÁ ÍÇáí Ý ÇáÚãá.');
		const embedNP = new Discord.RichEmbed()
	.setDescription(`:notes: ÇáÇä íÊã ÊÔÛíá : **${serverQueue.songs[0].title}**`);
		return msg.channel.sendEmbed(embedNP);
	} else if (command === `queue`) {

		
		if (!serverQueue) return msg.channel.send('áÇ íæÌÏ ÔíÁ ÍÇáí Ý ÇáÚãá.');
		let index = 0;
		
		const embedqu = new Discord.RichEmbed()

.setDescription(`**Songs Queue**
${serverQueue.songs.map(song => `**${++index} -** ${song.title}`).join('\n')}
**ÇáÇä íÊã ÊÔÛíá** ${serverQueue.songs[0].title}`);
		return msg.channel.sendEmbed(embedqu);
	} else if (command === `pause`) {

		if (serverQueue && serverQueue.playing) {
			serverQueue.playing = false;
			serverQueue.connection.dispatcher.pause();
			return msg.channel.send('Êã ÅíÞÇÝ ÇáãæÓíÞì ãÄÞÊÇ!');
		}
		return msg.channel.send('áÇ íæÌÏ ÔíÁ ÍÇáí Ý ÇáÚãá.');
	} else if (command === "resume") {

		if (serverQueue && !serverQueue.playing) {
			serverQueue.playing = true;
			serverQueue.connection.dispatcher.resume();
			return msg.channel.send('ÇÓÊÃäÝÊ ÇáãæÓíÞì ÈÇáäÓÈÉ áß !');
		}
		return msg.channel.send('áÇ íæÌÏ ÔíÁ ÍÇáí Ýí ÇáÚãá.');
	}

	return undefined;
});

async function handleVideo(video, msg, voiceChannel, playlist = false) {
	const serverQueue = queue.get(msg.guild.id);
	console.log(video);
	
//	console.log('yao: ' + Util.escapeMarkdown(video.thumbnailUrl));
	const song = {
		id: video.id,
		title: Util.escapeMarkdown(video.title),
		url: `https://www.youtube.com/watch?v=${video.id}`
	};
	if (!serverQueue) {
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true
		};
		queue.set(msg.guild.id, queueConstruct);

		queueConstruct.songs.push(song);

		try {
			var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			play(msg.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`I could not join the voice channel: ${error}`);
			queue.delete(msg.guild.id);
			return msg.channel.send(`áÇ ÃÓÊØíÚ ÏÎæá åÐÂ ÇáÑæã ${error}`);
		}
	} else {
		serverQueue.songs.push(song);
		console.log(serverQueue.songs);
		if (playlist) return undefined;
		else return msg.channel.send(` **${song.title}** Êã ÇÖÇÝå ÇáÇÛäíÉ Çáí ÇáÞÇÆãÉ!`);
	}
	return undefined;
}

function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}
	console.log(serverQueue.songs);

	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', reason => {
			if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.');
			else console.log(reason);
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

	serverQueue.textChannel.send(`ÈÏÁ ÊÔÛíá : **${song.title}**`);
}

const adminprefix = "1vip";
const devs = ['380254757455134725','380254757455134725'];
client.on('message', message => {
  var argresult = message.content.split(` `).slice(1).join(' ');
    if (!devs.includes(message.author.id)) return;
    
if (message.content.startsWith(adminprefix + 'setgame')) {
  client.user.setGame(argresult);
    message.channel.sendMessage(`**${argresult} Êã ÊÛííÑ ÈáÇíäÞ ÇáÈæÊ Åáì **`);
} else 
  if (message.content.startsWith(adminprefix + 'setname')) {
client.user.setUsername(argresult).then;
    message.channel.sendMessage(`**${argresult}** : Êã ÊÛííÑ ÃÓã ÇáÈæÊ Åáì`);
return message.reply("**áÇ íãßäß ÊÛííÑ ÇáÇÓã íÌÈ Úáíß ÇáÇäÊÙÂÑ áãÏÉ ÓÇÚÊíä . **");
} else
  if (message.content.startsWith(adminprefix + 'setavatar')) {
client.user.setAvatar(argresult);
  message.channel.sendMessage(`**${argresult}** : Êã ÊÛíÑ ÕæÑÉ ÇáÈæÊ`);
      } else     
if (message.content.startsWith(adminprefix + 'setT')) {
  client.user.setGame(argresult, "https://www.twitch.tv/idk");
    message.channel.sendMessage(`**Êã ÊÛííÑ ÊæíÊÔ ÇáÈæÊ Åáì  ${argresult}**`);
}

});

client.on("message", message => {
 if (message.content === `${prefix}viphelp`) {
 	
  const embed = new Discord.RichEmbed() 
      .setColor("#000000")
      .setDescription(`
${prefix}vipsetname ? ÊÛíÑ ÇÓã ÈæÊ
${prefix}vipsetavatar ? ÊÛíÑ ÕæÑÉ ÈæÊ
${prefix}vipsetT ? ÊÎáí ÈæÊ ÍÇáÊå ÈäÝÓÌí
${prefix}vipsetgame ? ÊÎáí ÍÇáÉ ÈæÊ íáÚÈ Ôí
 `);
   message.channel.sendEmbed(embed);
    
   }
   }); 

client.on("message", message => {
 if (message.content === `${prefix}help`) {
 	
  const embed = new Discord.RichEmbed() 
      .setColor("#000000")
      .setDescription(`
${prefix}play ? áÊÔÛíá ÃÛäíÉ ÈÑÂÈØ Ãæ ÈÃÓã
${prefix}skip ? áÊÌÂæÒ ÇáÃÛäíÉ ÇáÍÂáíÉ
${prefix}pause ? ÅíÞÂÝ ÇáÃÛäíÉ ãÄÞÊÇ
${prefix}resume ? áãæÂÕáÉ ÇáÅÛäíÉ ÈÚÏ ÅíÞÂÝåÂ ãÄÞÊÇ
${prefix}vol ? áÊÛííÑ ÏÑÌÉ ÇáÕæÊ 100 - 0
${prefix}stop ? áÅÎÑÂÌ ÇáÈæÊ ãä ÇáÑæã
${prefix}np ? áãÚÑÝÉ ÇáÃÛäíÉ ÇáãÔÛáÉ ÍÂáíÇ
${prefix}queue ? áãÚÑÝÉ ÞÂÆãÉ ÇáÊÔÛíá
${prefix}viphelp ? áãÚÑÝå ÇæÇãÑ vip
`);
   message.channel.sendEmbed(embed);
    
   }
   }); 



client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`in ${client.guilds.size} servers `);
    console.log(`[Codes] ${client.users.size}`);
    client.user.setStatus("DND");
});





client.login(NTA5NDgwNTYyNTAzODQzODQx.DsOaUQ.GoeqF-k2r0qjPqvzMl-JJr4S4Ho);