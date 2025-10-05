import fs from 'fs';
import path from 'path';
import { REST, Routes } from 'discord.js';
import { fileURLToPath } from 'url';
import { clientId, guildId, token } from './config.json' assert { type: 'json' };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
const foldersPath = path.join(__dirname, 'commands');

for (const folder of fs.readdirSync(foldersPath)) {
	const commandsPath = path.join(foldersPath, folder);
	for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
		const command = await import(`./commands/${folder}/${file}`);
		if ('data' in command.default && 'execute' in command.default) {
			commands.push(command.default.data.toJSON());
		} else {
			console.log(`[警告] ${file} に "data" または "execute" が見つかりません。`);
		}
	}
}

const rest = new REST().setToken(token);

(async () => {
	try {
		console.log(`🔄 ${commands.length} 件のスラッシュコマンドを登録中...`);

		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`✅ 登録完了！ ${data.length} 件のコマンドを更新しました。`);
	} catch (error) {
		console.error('❌ 登録エラー:', error);
	}
})();
