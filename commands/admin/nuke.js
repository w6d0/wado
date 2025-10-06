import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { createLogImage } from '../../utils/logImage.js';

export default {
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('チャンネルを完全リセットします（ログ付き）')
    .addChannelOption(o => o.setName('channel').setDescription('対象チャンネル').setRequired(false))
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

    await interaction.editReply({ embeds: [embed], components: [row], files: ['./commands/admin/Guild.png'] });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 20000,
    });

    collector.on('collect', async i => {
      if (!i.deferred && !i.replied) await i.deferUpdate();

      if (i.customId === 'yes_nuke') {
        try {
          const newChannel = await targetChannel.clone({ reason: `Nuke by ${interaction.user.tag}` });
          await newChannel.setPosition(targetChannel.position + 1);
          await targetChannel.delete();

          const logFile = await createLogImage({
            title: '💣 Nuke Log',
            user: interaction.user.tag,
            channel: newChannel.name,
            action: 'nuke',
          });

          const done = new EmbedBuilder()
            .setColor(0x00ffcc)
            .setTitle('✅ チャンネル再構築完了')
            .setDescription(`\`\`\`diff\n+ #${newChannel.name} を再作成しました。\n\`\`\``);

          await newChannel.send({ embeds: [done], files: [logFile] });
          await interaction.editReply({ embeds: [done], components: [], files: [logFile] });
        } catch (err) {
          await interaction.editReply({ content: `⚠️ エラー: ${err.message}` });
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
