import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('userinfo')
		.setDescription('ユーザー情報を表示します')
		.addUserOption(option =>
			option.setName('target').setDescription('対象のユーザー').setRequired(false)
		),

	async execute(interaction) {
		const user = interaction.options.getUser('target') || interaction.user;
		const member = await interaction.guild.members.fetch(user.id);

		const embed = new EmbedBuilder()
			.setColor(0x5865f2)
			.setTitle(`👤 ${user.username} さんの情報`)
			.setThumbnail(user.displayAvatarURL({ dynamic: true }))
			.addFields(
				{ name: '🆔 ユーザーID', value: `\`${user.id}\``, inline: true },
				{ name: '🕒 アカウント作成日', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: true },
				{ name: '🏰 サーバー参加日', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` },
			)
			.setFooter({ text: 'わどぼっと✨', iconURL: interaction.client.user.displayAvatarURL() });

		await interaction.reply({ embeds: [embed] });
	},
};
