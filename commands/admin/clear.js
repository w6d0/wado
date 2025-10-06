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
    .setName('clear')
    .setDescription('指定したチャンネルのメッセージを削除します（確認あり）')
    .addIntegerOption(o =>
      o.setName('amount').setDescription('削除するメッセージ数（最大100）').setRequired(true)
    )
    .addChannelOption(o =>
      o.setName('channel').setDescription('削除対象チャンネル（未指定ならこのチャンネル）').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const amount = interaction.options.getInteger('amount');
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    if (amount < 1 || amount > 100)
      return interaction.editReply('⚠️ 削除できる数は **1〜100** の間です。');

    const embed = new EmbedBuilder()
      .setColor(0xffa534)
      .setTitle('🧹 メッセージ削除 確認')
      .setDescription(
        `以下の内容で削除を実行しますか？\n\n\`\`\`yaml\nチャンネル: #${targetChannel.name}\n削除件数: ${amount}\n実行者: ${interaction.user.tag}\n\`\`\``
      )
      .setImage('attachment://Guild.png');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('yes_clear').setLabel('はい').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('no_clear').setLabel('いいえ').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel('🕒 履歴を見る')
        .setStyle(ButtonStyle.Link)
        .setURL('https://wado.onrender.com/clear-logs')
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

      if (i.customId === 'yes_clear') {
        try {
          const messages = await targetChannel.bulkDelete(amount, true);
          const done = new EmbedBuilder()
            .setColor(0x00ffcc)
            .setTitle('✅ 削除完了')
            .setDescription(
              `\`\`\`diff\n+ ${messages.size} 件のメッセージを削除しました。\n+ チャンネル: #${targetChannel.name}\n\`\`\``
            )
            .setFooter({ text: `実行者: ${interaction.user.tag}` })
            .setImage('attachment://Guild.png');
          await interaction.editReply({ embeds: [done], components: [], files: ['./commands/admin/Guild.png'] });
        } catch (err) {
          await interaction.editReply({ content: `⚠️ エラー: ${err.message}`, components: [] });
        }
        collector.stop();
      }

      if (i.customId === 'no_clear') {
        await interaction.editReply({ content: '🚫 操作をキャンセルしました。', embeds: [], components: [] });
        collector.stop();
      }
    });
  },
};
