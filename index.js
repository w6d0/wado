import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import express from 'express';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// === コマンド読み込み ===
const foldersPath = path.join(__dirname, 'commands');
for (const folder of fs.readdirSync(foldersPath)) {
	const folderPath = path.join(foldersPath, folder);
	for (const file of fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))) {
		const command = await import(`./commands/${folder}/${file}`);
		client.commands.set(command.default.data.name, command.default);
	}
}

// === イベント読み込み ===
const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
	const event = await import(`./events/${file}`);
	if (event.default.once) {
		client.once(event.default.name, (...args) => event.default.execute(...args));
	} else {
		client.on(event.default.name, (...args) => event.default.execute(...args));
	}
}

// === Discordログイン ===
client.login(process.env.TOKEN);

// === Express (Renderでのステータス確認用API) ===
const app = express();

app.get('/', (req, res) => {
	res.send('わどぼっと is running!');
});

// ステータスAPI（GitHub Pagesから取得用）
app.get('/status', (req, res) => {
	const status = client.ws.status === 0 ? 'online' : 'offline';
	res.json({ status });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Express API running on port ${PORT}`));
