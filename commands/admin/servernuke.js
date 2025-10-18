import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('server-nuke')
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

// サーバー全削除（サーバーチャンネル／カテゴリーをすべて削除）
export const serverNuke = {
  data: new SlashCommandBuilder()
    .setName('servernuke')
    .setDescription('（管理者専用）サーバー内のチャンネルとカテゴリーをすべて削除します')
    .addStringOption(opt =>
      opt
        .setName('guild')
        .setDescription('対象ギルドID（省略時はこのサーバー）')
        .setRequired(false)
    )
    // 管理者限定にしておく
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.options.getString('guild') || interaction.guildId;

    // ギルド取得
    let targetGuild;
    try {
      targetGuild = interaction.client.guilds.cache.get(guildId) || (await interaction.client.guilds.fetch(guildId));
    } catch (err) {
      return interaction.editReply({ content: '⚠️ 指定されたギルドが見つかりません。IDを確認してください。' });
    }

    if (!targetGuild) {
      return interaction.editReply({ content: '⚠️ 指定されたギルドが見つかりません。' });
    }

    // Bot の権限チェック
    const me = targetGuild.members.me || (await targetGuild.members.fetch(interaction.client.user.id).catch(() => null));
    if (!me) return interaction.editReply({ content: '⚠️ 対象サーバーで Bot を検出できませんでした。' });

    if (!me.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.editReply({ content: '⚠️ この操作を行うには対象サーバーで「チャンネル管理」権限が必要です。' });
    }

    const totalChannels = targetGuild.channels.cache.size;

    const confirmEmbed = new EmbedBuilder()
      .setColor(0xff4d4d)
      .setTitle('🔥 サーバーヌーク確認')
      .setDescription(`以下のサーバー内のチャンネル／カテゴリーをすべて削除します。
\nサーバー: ${targetGuild.name}
ID: ${targetGuild.id}
チャンネル数: ${totalChannels}
\nこの操作は取り消せません。よろしければ「はい」を押してください。`);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('confirm_servernuke').setLabel('はい — 実行する').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('cancel_servernuke').setLabel('いいえ — キャンセル').setStyle(ButtonStyle.Secondary)
    );

    const msg = await interaction.editReply({ embeds: [confirmEmbed], components: [row] });

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 30000,
      max: 1,
    });

    collector.on('collect', async i => {
      if (i.customId === 'confirm_servernuke') {
        await i.update({ content: '🧨 実行中... チャンネルとカテゴリーを削除します。進捗はログに出力されます。', embeds: [], components: [] });

        let deleted = 0;
        let failed = 0;

        // 削除は非同期で逐次処理（簡易的な実装）
        for (const [, ch] of targetGuild.channels.cache) {
          try {
            if (ch.deletable) {
              await ch.delete(`Server nuke by ${interaction.user.tag}`);
              deleted++;
            } else {
              // 削除不可
              failed++;
            }
          } catch (err) {
            console.error('delete channel error', ch.id, err);
            failed++;
          }
        }

        const resultEmbed = new EmbedBuilder()
          .setColor(0x00ffcc)
          .setTitle('✅ サーバーヌーク完了')
          .setDescription(`削除済み: ${deleted}\n削除できなかった: ${failed}`)
          .setFooter({ text: '実行者: ' + interaction.user.tag });

        try {
          await interaction.followUp({ embeds: [resultEmbed], ephemeral: true });
        } catch (err) {
          console.error(err);
        }
      } else {
        await i.update({ content: '操作をキャンセルしました。', embeds: [], components: [] });
      }
    });
  },
};

// プレフィクス s!nuke 用のハンドラ（必要に応じてボットのコマンドハンドラから呼ぶ）
export async function handlePrefixNuke(message, args = []) {
  // args[0] に guildId を指定できる
  const guildId = args[0] || (message.guild ? message.guild.id : null);
  if (!guildId) {
    return message.reply('⚠️ ギルドIDが指定されていません。コマンドはサーバー内で実行するか、ギルドIDを引数で渡してください。');
  }

  // 権限チェック（呼び出し元）
  if (message.guild && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply('⚠️ このコマンドを実行するには管理者権限が必要です。');
  }

  let targetGuild;
  try {
    targetGuild = message.client.guilds.cache.get(guildId) || (await message.client.guilds.fetch(guildId));
  } catch (err) {
    return message.reply('⚠️ 指定されたギルドが見つかりません。');
  }

  if (!targetGuild) return message.reply('⚠️ 指定されたギルドが見つかりません。');

  // Bot の権限確認
  const me = targetGuild.members.me || (await targetGuild.members.fetch(message.client.user.id).catch(() => null));
  if (!me || !me.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return message.reply('⚠️ Bot に対象サーバーでの「チャンネル管理」権限がありません。');
  }

  // DM にて確認（DM は自分だけが見れる）
  const dm = await message.author.createDM();

  const confirmEmbed = new EmbedBuilder()
    .setColor(0xff4d4d)
    .setTitle('🔥 サーバーヌーク確認 (DM)')
    .setDescription(`サーバー: ${targetGuild.name}\nID: ${targetGuild.id}\nチャンネル数: ${targetGuild.channels.cache.size}\n\nこの操作は取り消せません。よろしければ「はい」を押してください。`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('confirm_servernuke_dm').setLabel('はい — 実行する').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('cancel_servernuke_dm').setLabel('いいえ — キャンセル').setStyle(ButtonStyle.Secondary)
  );

  const sent = await dm.send({ embeds: [confirmEmbed], components: [row] });

  const collector = sent.createMessageComponentCollector({ filter: i => i.user.id === message.author.id, time: 30000, max: 1 });

  collector.on('collect', async i => {
    if (i.customId === 'confirm_servernuke_dm') {
      await i.update({ content: '🧨 実行中... 削除を開始します。', embeds: [], components: [] });

      let deleted = 0;
      let failed = 0;

      for (const [, ch] of targetGuild.channels.cache) {
        try {
          if (ch.deletable) {
            await ch.delete(`Server nuke by ${message.author.tag}`);
            deleted++;
          } else {
            failed++;
          }
        } catch (err) {
          console.error('delete channel error', ch.id, err);
          failed++;
        }
      }

      const resultEmbed = new EmbedBuilder()
        .setColor(0x00ffcc)
        .setTitle('✅ サーバーヌーク完了')
        .setDescription(`削除済み: ${deleted}\n削除できなかった: ${failed}`)
        .setFooter({ text: '実行者: ' + message.author.tag });

      await dm.send({ embeds: [resultEmbed] });
    } else {
      await i.update({ content: '操作をキャンセルしました。', embeds: [], components: [] });
    }
  });
}
