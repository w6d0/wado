// ==========================
// わどぼっと 24時間稼働版
// ==========================

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
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
app.use(cors());

// 🔹 テスト用ルート
app.get('/', (req, res) => {
	res.send('わどぼっと is running!');
});

// 🔹 ステータスAPI
app.get('/status', (req, res) => {
	const status = client.ws.status === 0 ? 'online' : 'offline';
	res.json({ status });
});

// 🔹 サーバー起動（Render自動PORT）
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Express API running on port ${PORT}`));

// ===== Ready時ログ =====
client.once('ready', () => {
	console.log(`✅ Ready! Logged in as ${client.user.tag}`);
	client.user.setActivity('✨ わどぼっと 稼働中', { type: 3 });
});

// ===============================
// 🟢 Renderスリープ防止: 自己Ping機能
// ===============================
const SELF_URL = process.env.SELF_URL || 'https://wado.onrender.com';

// 🔁 定期的に自分にアクセス（5分おき）
setInterval(async () => {
	try {
		await fetch(`${SELF_URL}/status`);
		console.log('🔁 Self-ping sent to keep bot alive.');
	} catch (err) {
		console.error('⚠️ Self-ping failed:', err);
	}
}, 5 * 60 * 1000); // 5分
