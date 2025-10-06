import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
  time,
} from 'discord.js';

const timeOptions = [
  { name: '1分', ms: 60_000 },
  { name: '3分', ms: 3 * 60_000 },
  { name: '5分', ms: 5 * 60_000 },
  { name: '10分', ms: 10 * 60_000 },
  { name: '1時間', ms: 60 * 60_000 },
  { name: '10時間', ms: 10 * 60 * 60_000 },
  { name: '1日', ms: 24 * 60 * 60_000 },
  { name: '7日', ms: 7 * 24 * 60 * 60_000 },
];

export default {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('指定ユーザーを一定時間ミュートします（確認あり）')
    .addUserOption(o => o.setName('target').setDescription('対象ユーザー').setRequired(true))
    .addStringOption(o =>
      o
        .setName('duration')
        .setDescription('タイムアウト時間を選択')
        .setRequired(true)
        .addChoices(...timeOptions.map(t => ({ name: t.name, value: t.ms.toString() })))
    )
    .addStringOption(o => o.setName('reason').setDescription('理由').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const target = interaction.options.getUser('target');
    const duration = Number(interaction.options.getString('duration'));
    const reason = interaction.options.getString('reason') || '理由なし';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) return interaction.editReply('⚠️ 指定ユーザーが見つかりません。');

    const embed = new EmbedBuilder()
      .setColor(0xffa534)
      .setTitle('⏰ Timeout 確認')
      .setDescription(
        `以下のユーザーを ${timeOptions.find(t => t.ms === duration)?.name} ミュートしますか？\n\n\`\`\`yaml\nユーザー: ${target.tag}\nID: ${target.id}\n理由: ${reason}\n\`\`\``
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('yes_timeout').setLabel('はい').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('no_timeout').setLabel('いいえ').setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 20000,
    });

    collector.on('collect', async i => {
      await i.deferUpdate();

      if (i.customId === 'yes_timeout') {
        try {
          await member.timeout(duration, reason);
          const until = time(new Date(Date.now() + duration), 'R');
          const done = new EmbedBuilder()
            .setColor(0x00ffcc)
            .setTitle('✅ Timeout 完了')
            .setDescription(
              `\`\`\`diff\n+ ${target.tag} を ${timeOptions.find(t => t.ms === duration)?.name} ミュートしました。\n理由: ${reason}\n\`\`\`\n${until} に解除されます。`
            );
          await interaction.editReply({ embeds: [done], components: [] });
        } catch {
          await interaction.editReply({ content: '⚠️ Timeoutに失敗しました。', components: [] });
        }
        collector.stop();
      }

      if (i.customId === 'no_timeout') {
        await interaction.editReply({ content: '🚫 操作をキャンセルしました。', embeds: [], components: [] });
        collector.stop();
      }
    });
  },
};
