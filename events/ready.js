import { Events } from 'discord.js';

export default {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`✅ Ready! Logged in as ${client.user.tag}`);
		client.user.setActivity('✨ Stylish Bot is online!', { type: 3 });
	},
};
