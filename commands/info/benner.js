import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('benner') // ご要望どおり「benner」
    .setDescription('指定ユーザーのバナーを表示します（省略で自分）')
    .addUserOption((opt) => opt.setName('target').setDescription('対象ユーザー').setRequired(false)),

  async execute(interaction) {
    try {
      await interaction.deferReply(); // 応答予約

      const target = interaction.options.getUser('target') || interaction.user;

      // ユーザー情報を強制取得して banner を反映させる
      // client.users.fetch を使って最新情報を取得（バナー含む）
      const fetched = await interaction.client.users.fetch(target.id, { force: true });

      const bannerUrl = fetched.bannerURL?.({ size: 4096, dynamic: true }) || null;

      if (!bannerUrl) {
        // バナーが無い場合のEmbed
        const noEmbed = new EmbedBuilder()
          .setTitle(`${target.username} さんのバナー`)
          .setDescription('このユーザーはバナーを設定していません。')
          .setColor(0xffcc99)
          .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

        await interaction.editReply({ embeds: [noEmbed], components: [] });
        return;
      }

      // バナーがある場合
      const embed = new EmbedBuilder()
        .setTitle(`${target.username} さんのバナー`)
        .setColor(0xff8c42)
        .setImage(bannerUrl)
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

      const codeBlock = '```html\n' +
        `<!-- 画像URL -->\n<img src="${bannerUrl}" alt="banner" />\n\n` +
        `<!-- Markdown -->\n![banner](${bannerUrl})\n` +
        '```';

      const viewBtn = new ButtonBuilder()
        .setLabel('バナーを開く')
        .setStyle(ButtonStyle.Link)
        .setURL(bannerUrl);

      const row = new ActionRowBuilder().addComponents(viewBtn);

      await interaction.editReply({ content: codeBlock, embeds: [embed], components: [row] });
    } catch (err) {
      console.error('benner command error:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '⚠️ バナー取得中にエラーが発生しました。', flags: 64 });
      } else {
        await interaction.editReply({ content: '⚠️ バナー取得中にエラーが発生しました。', embeds: [], components: [] });
      }
    }
  },
};
