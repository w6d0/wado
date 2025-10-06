import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('指定ユーザーのBANを解除します（確認あり）')
    .addStringOption(o => o.setName('userid').setDescription('解除するユーザーのID').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const userId = interaction.options.getString('userid');

    const embed = new EmbedBuilder()
      .setColor(0x33ccff)
      .setTitle('🔓 Unban 確認')
      .setDescription(`\`\`\`yaml\nユーザーID: ${userId}\n\`\`\`\nこのユーザーのBANを解除しますか？`);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('yes_unban').setLabel('はい').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('no_unban').setLabel('いいえ').setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 20000,
    });

    collector.on('collect', async i => {
      await i.deferUpdate();

      if (i.customId === 'yes_unban') {
        try {
          await interaction.guild.members.unban(userId);
          const done = new EmbedBuilder()
            .setColor(0x00ffcc)
            .setTitle('✅ Unban 完了')
            .setDescription(`\`\`\`diff\n+ ユーザーID ${userId} のBANを解除しました。\n\`\`\``);
          await interaction.editReply({ embeds: [done], components: [] });
        } catch {
          await interaction.editReply({ content: '⚠️ Unbanに失敗しました。', components: [] });
        }
        collector.stop();
      }

      if (i.customId === 'no_unban') {
        await interaction.editReply({ content: '🚫 操作をキャンセルしました。', embeds: [], components: [] });
        collector.stop();
      }
    });
  },
};
