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
    .setName('nuke')
    .setDescription('指定したチャンネルを完全リセット（複製→削除）します（確認あり）')
    .addChannelOption(o =>
      o.setName('channel').setDescription('対象チャンネル（未指定ならこのチャンネル）').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    const embed = new EmbedBuilder()
      .setColor(0xff4d4d)
      .setTitle('💣 チャンネルリセット 確認')
      .setDescription(
        `以下のチャンネルを **完全リセット** しますか？\n\n\`\`\`yaml\nチャンネル: #${targetChannel.name}\nID: ${targetChannel.id}\n実行者: ${interaction.user.tag}\n\`\`\`\n⚠️ メッセージ履歴はすべて削除されます。`
      )
      .setImage('attachment://Guild.png');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('yes_nuke').setLabel('はい').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('no_nuke').setLabel('いいえ').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel('📜 履歴を見る')
        .setStyle(ButtonStyle.Link)
        .setURL('https://wado.onrender.com/nuke-logs')
    );

    await interaction.editReply({
      embeds: [embed],
      components: [row],
      files: ['./commands/admin/Guild.png'],
    });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 15000,
    });

    collector.on('collect', async i => {
      await i.deferUpdate();

      if (i.customId === 'yes_nuke') {
        try {
          const newChannel = await targetChannel.clone({
            reason: `Nuke by ${interaction.user.tag}`,
          });
          await newChannel.setPosition(targetChannel.position + 1);
          await targetChannel.delete();

          const done = new EmbedBuilder()
            .setColor(0x00ffcc)
            .setTitle('✅ チャンネル再構築 完了')
            .setDescription(
              `\`\`\`diff\n+ #${newChannel.name} を再構築しました。\n+ 旧チャンネルは削除されました。\n\`\`\``
            )
            .setImage('attachment://Guild.png')
            .setFooter({ text: `実行者: ${interaction.user.tag}` });

          await newChannel.send({ embeds: [done], files: ['./commands/admin/Guild.png'] });
          await interaction.editReply({ embeds: [done], components: [], files: ['./commands/admin/Guild.png'] });
        } catch (err) {
          await interaction.editReply({ content: `⚠️ エラー: ${err.message}`, components: [] });
        }
        collector.stop();
      }

      if (i.customId === 'no_nuke') {
        await interaction.editReply({ content: '🚫 操作をキャンセルしました。', embeds: [], components: [] });
        collector.stop();
      }
    });
  },
};
