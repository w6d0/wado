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
    .setName('kick')
    .setDescription('指定ユーザーをKickします（確認あり）')
    .addUserOption(opt => opt.setName('target').setDescription('Kickするユーザー').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('理由').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || '理由なし';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) return interaction.editReply('⚠️ 指定ユーザーが見つかりません。');

    const embed = new EmbedBuilder()
      .setColor(0xffc107)
      .setTitle('⚠️ Kick 確認')
      .setDescription(
        `以下のユーザーをKickしますか？\n\n\`\`\`yaml\nユーザー: ${target.tag}\nID: ${target.id}\n理由: ${reason}\n\`\`\``
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('yes_kick').setLabel('はい').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('no_kick').setLabel('いいえ').setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 20000,
    });

    collector.on('collect', async i => {
      await i.deferUpdate();

      if (i.customId === 'yes_kick') {
        try {
          await member.kick(reason);
          const done = new EmbedBuilder()
            .setColor(0x00ffcc)
            .setTitle('✅ Kick 完了')
            .setDescription(`\`\`\`diff\n+ ${target.tag} をKickしました。\n理由: ${reason}\n\`\`\``);
          await interaction.editReply({ embeds: [done], components: [] });
        } catch {
          await interaction.editReply({ content: '⚠️ Kickに失敗しました。', components: [] });
        }
        collector.stop();
      }

      if (i.customId === 'no_kick') {
        await interaction.editReply({ content: '🚫 操作をキャンセルしました。', embeds: [], components: [] });
        collector.stop();
      }
    });
  },
};
