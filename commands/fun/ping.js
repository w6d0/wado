import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Pingを測定します！'),

	async execute(interaction) {
		const sent = await interaction.reply({ content: '🏓 計測中...', fetchReply: true });
		const latency = sent.createdTimestamp - interaction.createdTimestamp;

		const embed = new EmbedBuilder()
			.setColor(0x00ffcc)
			.setTitle('🏓 Pong!')
			.setDescription(`\`\`\`js\nBot latency: ${latency}ms\nAPI latency: ${Math.round(interaction.client.ws.ping)}ms\n\`\`\``)
			.setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

		const button = new ButtonBuilder()
			.setLabel('GitHubで見る')
			.setStyle(ButtonStyle.Link)
			.setURL('https://github.com/yourusername/yourbot');

		const row = new ActionRowBuilder().addComponents(button);

		await interaction.editReply({ content: '', embeds: [embed], components: [row] });
	},
};
