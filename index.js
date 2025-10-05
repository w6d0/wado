// ==========================
// わどぼっと
// ==========================

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors'; // ← 追加！
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===== Discord Client 設定 =====
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// ===== コマンド登録 =====
const foldersPath = path.join(__dirname, 'commands');
for (const folder of fs.readdirSync(foldersPath)) {
	const folderPath = path.join(foldersPath, folder);
	for (const file of fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))) {
		const command = await import(`./commands/${folder}/${file}`);
		client.commands.set(command.default.data.name, command.default);
	}
}

// ===== イベント登録 =====
const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
	const event = await import(`./events/${file}`);
	if (event.default.once) {
		client.once(event.default.name, (...args) => event.default.execute(...args));
	} else {
		client.on(event.default.name, (...args) => event.default.execute(...args));
	}
}

// ===== Discord ログイン =====
client.login(process.env.TOKEN);

// ===== Express サーバー（Render用API） =====
const app = express();
app.use(cors()); // 🌐 ← GitHub Pagesからのアクセスを許可！

// テスト用ルート
app.get('/', (req, res) => {
	res.send('わどぼっと is running!');
});

// GitHub Pages側が利用するステータスAPI
app.get('/status', (req, res) => {
	const status = client.ws.status === 0 ? 'online' : 'offline';
	res.json({ status });
});

// サーバー起動（Renderが自動でPORT指定）
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Express API running on port ${PORT}`));

// ===== Ready時ログ =====
client.once('ready', () => {
	console.log(`✅ Ready! Logged in as ${client.user.tag}`);
	client.user.setActivity('✨ わどぼっと 稼働中', { type: 3 });
});
