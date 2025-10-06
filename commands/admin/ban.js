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
    .setName('ban')
    .setDescription('指定ユーザーをBANします（確認あり）')
    .addUserOption(opt => opt.setName('target').setDescription('BANするユーザー').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('理由').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || '理由なし';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) return interaction.editReply('⚠️ 指定ユーザーが見つかりません。');

    const embed = new EmbedBuilder()
      .setColor(0xff4d4d)
      .setTitle('🚨 BAN 確認')
      .setDescription(
        `以下のユーザーをBANしますか？\n\n\`\`\`yaml\nユーザー: ${target.tag}\nID: ${target.id}\n理由: ${reason}\n\`\`\``
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('yes_ban').setLabel('はい').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('no_ban').setLabel('いいえ').setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 20000,
    });

    collector.on('collect', async i => {
      await i.deferUpdate();

      if (i.customId === 'yes_ban') {
        try {
          await member.ban({ reason });
          const done = new EmbedBuilder()
            .setColor(0x00ffcc)
            .setTitle('✅ BAN 完了')
            .setDescription(`\`\`\`diff\n+ ${target.tag} をBANしました。\n理由: ${reason}\n\`\`\``);
          await interaction.editReply({ embeds: [done], components: [] });
        } catch {
          await interaction.editReply({ content: '⚠️ BANに失敗しました。', components: [] });
        }
        collector.stop();
      }

      if (i.customId === 'no_ban') {
        await interaction.editReply({ content: '🚫 操作をキャンセルしました。', embeds: [], components: [] });
        collector.stop();
      }
    });
  },
};
