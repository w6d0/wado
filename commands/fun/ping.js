import {
	SlashCommandBuilder,
	EmbedBuilder,
	ButtonBuilder,
	ActionRowBuilder,
	ButtonStyle,
} from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Pingを測定します！'),

	async execute(interaction) {
		try {
			// ✅ Discordに応答予約（3秒制限を回避）
			await interaction.deferReply();

			// ⚡ Pingを測定
			const apiPing = Math.round(interaction.client.ws.ping);
			const latency = Date.now() - interaction.createdTimestamp;

			// 🧩 Embed作成
			const embed = new EmbedBuilder()
				.setColor(0x00ffcc)
				.setTitle('🏓 Pong!')
				.setDescription(
					`\`\`\`js\nBot latency: ${latency}ms\nAPI latency: ${apiPing}ms\n\`\`\``
				)
				.setFooter({
					text: `Requested by ${interaction.user.tag}`,
					iconURL: interaction.user.displayAvatarURL(),
				});

			// 🔗 ボタン作成（公式サイトリンク）
			const button = new ButtonBuilder()
				.setLabel('公式サイトを見る')
				.setStyle(ButtonStyle.Link)
				.setURL('https://w6d0.github.io/wado-support/');

			const row = new ActionRowBuilder().addComponents(button);

			// ✅ メッセージ送信
			await interaction.editReply({ embeds: [embed], components: [row] });
		} catch (error) {
			console.error('Ping command error:', error);
			if (!interaction.replied && !interaction.deferred) {
				await interaction.reply({
					content: '⚠️ エラーが発生しました。',
					flags: 64, // ephemeralフラグの新形式
				});
			}
		}
	},
};
