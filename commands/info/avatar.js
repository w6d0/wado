import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('指定ユーザーのアバターを表示します（省略で自分）')
    .addUserOption((opt) => opt.setName('target').setDescription('対象ユーザー').setRequired(false)),

  async execute(interaction) {
    try {
      await interaction.deferReply(); // 応答予約

      const target = interaction.options.getUser('target') || interaction.user;
      // フルURLを取得（最大サイズ、動的）
      const avatarUrl = target.displayAvatarURL({ size: 4096, dynamic: true });

      // Embed を作成
      const embed = new EmbedBuilder()
        .setTitle(`${target.username} さんのアバター`)
        .setColor(0xff8c42)
        .setImage(avatarUrl)
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

      // コードブロック（表示用） — URL と Markdown / HTML サンプル
      const codeBlock = '```html\n' +
        `<!-- 画像URL -->\n<img src="${avatarUrl}" alt="avatar" />\n\n` +
        `<!-- Markdown -->\n![avatar](${avatarUrl})\n` +
        '```';

      // ボタン（リンク）
      const viewButton = new ButtonBuilder()
        .setLabel('画像を開く')
        .setStyle(ButtonStyle.Link)
        .setURL(avatarUrl);

      const row = new ActionRowBuilder().addComponents(viewButton);

      await interaction.editReply({ content: codeBlock, embeds: [embed], components: [row] });
    } catch (err) {
      console.error('avatar command error:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '⚠️ アバター取得中にエラーが発生しました。', flags: 64 });
      } else {
        await interaction.editReply({ content: '⚠️ アバター取得中にエラーが発生しました。', embeds: [], components: [] });
      }
    }
  },
};
