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
    .setName('untimeout')
    .setDescription('指定ユーザーのTimeoutを解除します（確認あり）')
    .addUserOption(o => o.setName('target').setDescription('解除対象ユーザー').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const target = interaction.options.getUser('target');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) return interaction.editReply('⚠️ 指定ユーザーが見つかりません。');

    const embed = new EmbedBuilder()
      .setColor(0x33ccff)
      .setTitle('🔓 Timeout解除 確認')
      .setDescription(`\`\`\`yaml\nユーザー: ${target.tag}\nID: ${target.id}\n\`\`\`\nこのユーザーのタイムアウトを解除しますか？`);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('yes_untimeout').setLabel('はい').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('no_untimeout').setLabel('いいえ').setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 20000,
    });

    collector.on('collect', async i => {
      await i.deferUpdate();

      if (i.customId === 'yes_untimeout') {
        try {
          await member.timeout(null);
          const done = new EmbedBuilder()
            .setColor(0x00ffcc)
            .setTitle('✅ Timeout解除 完了')
            .setDescription(`\`\`\`diff\n+ ${target.tag} のタイムアウトを解除しました。\n\`\`\``);
          await interaction.editReply({ embeds: [done], components: [] });
        } catch {
          await interaction.editReply({ content: '⚠️ Timeout解除に失敗しました。', components: [] });
        }
        collector.stop();
      }

      if (i.customId === 'no_untimeout') {
        await interaction.editReply({ content: '🚫 操作をキャンセルしました。', embeds: [], components: [] });
        collector.stop();
      }
    });
  },
};
