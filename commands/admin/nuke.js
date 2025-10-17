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
    .setDescription('チャンネルを完全リセットします（画像＋ログ付き）')
    .addChannelOption(opt =>
      opt.setName('channel').setDescription('対象チャンネル').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    const embed = new EmbedBuilder()
      .setColor(0xff4d4d)
      .setTitle('💣 チャンネルリセット確認')
      .setDescription(
        `以下のチャンネルをリセットしますか？\n\`\`\`yaml\nチャンネル: #${targetChannel.name}\nID: ${targetChannel.id}\n\`\`\``
      )
      .setImage('attachment://Guild.png');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('yes_nuke').setLabel('はい').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('no_nuke').setLabel('いいえ').setStyle(ButtonStyle.Secondary)
    );

    const msg = await interaction.editReply({
      embeds: [embed],
      components: [row],
      files: [{ attachment: './commands/admin/Guild.png', name: 'Guild.png' }],
    });

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 20000,
    });

    collector.on('collect', async i => {
      if (i.customId === 'yes_nuke') {
        await i.update({ content: '💣 チャンネルを再構築中...', embeds: [], components: [] });
        try {
          const newChannel = await targetChannel.clone({ reason: `Nuke by ${interaction.user.tag}` });
          await newChannel.setPosition(targetChannel.position + 1);
          await targetChannel.delete();

          const logEmbed = new EmbedBuilder()
            .setColor(0x00ffcc)
            .setTitle('✅ チャンネル再構築完了')
            .setDescription(
              `\`\`\`yaml\n実行者: ${interaction.user.tag}\n再構築チャンネル: #${newChannel.name}\n時間: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}\n\`\`\``
            )
            .setImage('attachment://Guild.png')
            .setFooter({ text: 'わどぼっと 自動ログ生成' });

          await newChannel.send({
            embeds: [logEmbed],
            files: [{ attachment: './commands/admin/Guild.png', name: 'Guild.png' }],
          });
        } catch (err) {
          console.error(err);
        }
      } else {
        await i.update({ content: '🚫 操作をキャンセルしました。', embeds: [], components: [] });
      }
    });
  },
};
