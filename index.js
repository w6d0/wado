import fs from 'fs';
import path from 'path';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { fileURLToPath } from 'url';
import { token } from './config.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');

for (const folder of fs.readdirSync(commandsPath)) {
	const folderPath = path.join(commandsPath, folder);
	for (const file of fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))) {
		const command = await import(`./commands/${folder}/${file}`);
		client.commands.set(command.default.data.name, command.default);
	}
}

const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
	const event = await import(`./events/${file}`);
	if (event.default.once) {
		client.once(event.default.name, (...args) => event.default.execute(...args));
	} else {
		client.on(event.default.name, (...args) => event.default.execute(...args));
	}
}

client.login(token);
