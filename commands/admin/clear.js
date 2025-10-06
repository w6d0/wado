import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { createLogImage } from '../../utils/logImage.js';
import path from 'path';

export default {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('指定チャンネルのメッセージを削除します（ログ付き）')
    .addIntegerOption(o => o.setName('amount').setDescription('削除する件数（最大100）').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('対象チャンネル').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const amount = interaction.options.getInteger('amount');
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

    if (amount < 1 || amount > 100)
      return interaction.editReply('⚠️ 削除数は 1〜100 の範囲で指定してください。');

    const embed = new EmbedBuilder()
      .setColor(0xffa534)
      .setTitle('🧹 削除確認')
      .setDescription(
        `以下の内容で削除を実行しますか？\n\`\`\`yaml\nチャンネル: #${targetChannel.name}\n件数: ${amount}\n\`\`\``
      )
      .setImage('attachment://Guild.png');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('yes_clear').setLabel('はい').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('no_clear').setLabel('いいえ').setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [embed], components: [row], files: ['./commands/admin/Guild.png'] });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 20000,
    });

    collector.on('collect', async i => {
      await i.deferUpdate();

      if (i.customId === 'yes_clear') {
        try {
          const deleted = await targetChannel.bulkDelete(amount, true);
          const logFile = await createLogImage({
            title: '🧹 Clear Log',
            user: interaction.user.tag,
            channel: targetChannel.name,
            count: deleted.size,
            action: 'clear',
          });

          const done = new EmbedBuilder()
            .setColor(0x00ffcc)
            .setTitle('✅ 削除完了')
            .setDescription(
              `\`\`\`diff\n+ ${deleted.size} 件のメッセージを削除しました。\n+ チャンネル: #${targetChannel.name}\n\`\`\``
            );

          await interaction.editReply({ embeds: [done], components: [], files: [logFile] });
        } catch (err) {
          await interaction.editReply({ content: `⚠️ エラー: ${err.message}` });
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
