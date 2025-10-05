import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { REST, Routes } from 'discord.js';
import { fileURLToPath } from 'url';

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
		}
	}
}

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
	try {
		console.log(`🔄 ${commands.length} 件のコマンドを登録中...`);

		await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
			{ body: commands },
		);

		console.log(`✅ 登録完了！`);
	} catch (error) {
		console.error('❌ 登録エラー:', error);
	}
})();
