require("dotenv").config();
const { Client, IntentsBitField } = require("discord.js");
const { OpenAI } = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
});

client.on("ready", () => {
    console.log(`Le bot est prêt!`);
});

client.on("messageCreate", async message => {
    console.log('message créé');
    if (message.author.bot || message.channel.id !== process.env.CHANNEL_ID || message.content.startsWith("!")) {
        return;
    }

   
    if (!message.member.permissions.has("BAN_MEMBERS")) {
        return await message.reply("Désolé, vous n'avez pas la permission de bannir des membres.");
    }

    const args = message.content.trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === "!ban") {
  
        const userToBan = message.mentions.users.first();
        if (!userToBan) {
            return await message.reply("Veuillez mentionner l'utilisateur que vous souhaitez bannir.");
        }

        try {
        
            const memberToBan = await message.guild.members.fetch(userToBan);
            // ban l'uttilisateur 
            await memberToBan.ban();
            await message.reply(`L'utilisateur ${userToBan.tag} a été banni avec succès.`);
        } catch (error) {
            console.error(`Error: ${error}`);
            await message.reply(`Désolé, une erreur est survenue lors du bannissement de l'utilisateur. ${error.message}`);
        }
    } else {
        let conversationLOG = [{ role: 'system', content: "Je suis un bot"}];

        try {
            await message.channel.sendTyping();
            const prevMessages = await message.channel.messages.fetch({ limit: 15 });

            prevMessages.reverse().forEach(msg => {
                if (msg.content.startsWith("!") || (msg.author.bot && msg.author.id !== client.user.id)) {
                    return;
                }

                const role = msg.author.id === client.user.id ? 'assistant' : 'user';

                const name = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/g, "");

                conversationLOG.push({ role, content: msg.content });
            });

            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: conversationLOG
            });

            if (completion.choices.length > 0 && completion.choices[0].message) {
                await message.reply(completion.choices[0].message);
            }
        } catch (error) {
            console.error(`Error: ${error}`);
            await message.reply(`Désolé, je n'ai pas pu répondre à votre message. ${error.message}`);
        }
    }
});

client.login(process.env.TOKEN);
