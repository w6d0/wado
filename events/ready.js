import { Events } from 'discord.js';

export default {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`✅ Logged in as ${client.user.tag}`);
		client.user.setActivity('✨ Ready to serve!', { type: 3 });
	},
};
