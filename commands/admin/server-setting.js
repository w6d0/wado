import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ChannelType,
} from 'discord.js';

const ADMIN_ROLE_ID = '1424350813773627502';
const MEMBER_ROLE_ID = '1424378021091217529';

export default {
  data: new SlashCommandBuilder()
    .setName('server-setting')
    .setDescription('サーバーを安全に再構築します（管理者専用）')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      // ✅ 応答を予約（3秒制限回避）
      await interaction.deferReply({ flags: 64 }); // 旧 ephemeral: true

      // --- 確認Embed ---
      const embed = new EmbedBuilder()
        .setColor(0xffa534)
        .setTitle('⚙️ サーバー再構築の確認')
        .setDescription(
          '現在のすべてのチャンネルを削除して、新しい構成を作り直しますか？\n\n```diff\n- 注意: この操作は取り消せません。\n```'
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('yes_reset').setLabel('はい').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('no_reset').setLabel('いいえ').setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({ embeds: [embed], components: [row] });

      const filter = (i) => i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async (i) => {
        await i.deferUpdate();

        // ======================
        // ✅ 「はい」→ 再構築開始
        // ======================
        if (i.customId === 'yes_reset') {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x00ff66)
                .setTitle('🔄 サーバー再構築中...')
                .setDescription('現在のチャンネルを削除しています。少々お待ちください。'),
            ],
            components: [],
          });

          // 🔥 既存チャンネル削除
          for (const channel of interaction.guild.channels.cache.values()) {
            try {
              await channel.delete('Rebuild server');
            } catch (e) {
              console.log(`❌ Failed to delete channel: ${channel.name}`);
            }
          }

          // 📁 新カテゴリ作成
          const welcome = await interaction.guild.channels.create({
            name: 'Welcome',
            type: ChannelType.GuildCategory,
          });
          const free = await interaction.guild.channels.create({
            name: 'free',
            type: ChannelType.GuildCategory,
          });
          const admin = await interaction.guild.channels.create({
            name: 'admin',
            type: ChannelType.GuildCategory,
          });
          const ticket = await interaction.guild.channels.create({
            name: 'ticket',
            type: ChannelType.GuildCategory,
          });

          // 🧩 Welcome
          await interaction.guild.channels.create({
            name: 'welcome',
            type: ChannelType.GuildText,
            parent: welcome,
          });
          await interaction.guild.channels.create({
            name: 'rules',
            type: ChannelType.GuildText,
            parent: welcome,
          });
          await interaction.guild.channels.create({
            name: 'news',
            type: ChannelType.GuildText,
            parent: welcome,
          });

          // 🧩 Free
          await interaction.guild.channels.create({
            name: 'chat',
            type: ChannelType.GuildText,
            parent: free,
          });
          await interaction.guild.channels.create({
            name: 'bot-commands',
            type: ChannelType.GuildText,
            parent: free,
          });
          await interaction.guild.channels.create({
            name: 'VC1',
            type: ChannelType.GuildVoice,
            parent: free,
          });
          await interaction.guild.channels.create({
            name: 'VC2',
            type: ChannelType.GuildVoice,
            parent: free,
          });

          // 🧩 Admin
          const logsChannel = await interaction.guild.channels.create({
            name: 'logs',
            type: ChannelType.GuildText,
            parent: admin,
            permissionOverwrites: [
              {
                id: ADMIN_ROLE_ID,
                allow: [PermissionFlagsBits.ViewChannel],
              },
              {
                id: MEMBER_ROLE_ID,
                deny: [PermissionFlagsBits.ViewChannel],
              },
            ],
          });

          await interaction.guild.channels.create({
            name: 'admin-chat',
            type: ChannelType.GuildText,
            parent: admin,
            permissionOverwrites: [
              {
                id: ADMIN_ROLE_ID,
                allow: [PermissionFlagsBits.ViewChannel],
              },
              {
                id: MEMBER_ROLE_ID,
                deny: [PermissionFlagsBits.ViewChannel],
              },
            ],
          });

          // 🧩 Ticket
          await interaction.guild.channels.create({
            name: 'ticket-受付',
            type: ChannelType.GuildText,
            parent: ticket,
          });

          // ✅ 完了Embed
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x00ffcc)
                .setTitle('✅ サーバー再構築が完了しました！')
                .setDescription('すべてのカテゴリとチャンネルを安全に再構成しました。'),
            ],
            components: [],
          });

          // 🧾 ログ通知
          if (logsChannel) {
            const logEmbed = new EmbedBuilder()
              .setColor(0xffa534)
              .setTitle('🛠 サーバー再構築が実行されました')
              .setDescription(
                `実行者: <@${interaction.user.id}>\n\n\`\`\`diff\n+ サーバーのチャンネルとカテゴリが新しく再構築されました。\n\`\`\``
              )
              .setTimestamp()
              .setFooter({ text: 'わどぼっと | 管理ログ' });

            await logsChannel.send({ embeds: [logEmbed] });
          }

          collector.stop();
        }

        // ======================
        // ❌ 「いいえ」→ 追加確認
        // ======================
        if (i.customId === 'no_reset') {
          const embed2 = new EmbedBuilder()
            .setColor(0xffc300)
            .setTitle('🗂 チャンネルを削除せずに追加しますか？')
            .setDescription('既存チャンネルを削除せずに、新しいカテゴリを一番下に追加しますか？');

          const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('yes_add').setLabel('はい').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('no_add').setLabel('いいえ').setStyle(ButtonStyle.Secondary)
          );

          await interaction.editReply({ embeds: [embed2], components: [row2] });
        }

        // ======================
        // ✅ 下に追加する場合
        // ======================
        if (i.customId === 'yes_add') {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(0x00ffcc)
                .setTitle('🆕 新しいカテゴリを一番下に追加しました！'),
            ],
            components: [],
          });

          await interaction.guild.channels.create({ name: 'Welcome', type: ChannelType.GuildCategory });
          await interaction.guild.channels.create({ name: 'free', type: ChannelType.GuildCategory });
          await interaction.guild.channels.create({ name: 'admin', type: ChannelType.GuildCategory });
          await interaction.guild.channels.create({ name: 'ticket', type: ChannelType.GuildCategory });

          const logChannel = interaction.guild.channels.cache.find(ch => ch.name === 'logs');
          if (logChannel) {
            const logEmbed = new EmbedBuilder()
              .setColor(0x00ffcc)
              .setTitle('📁 新しいカテゴリを追加しました')
              .setDescription(`実行者: <@${interaction.user.id}>`)
              .setTimestamp()
              .setFooter({ text: 'わどぼっと | 管理ログ' });
            await logChannel.send({ embeds: [logEmbed] });
          }

          collector.stop();
        }

        // ======================
        // 🚫 キャンセル
        // ======================
        if (i.customId === 'no_add') {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(0xff4d4d)
                .setTitle('🚫 操作をキャンセルしました'),
            ],
            components: [],
          });
          collector.stop();
        }
      });
    } catch (err) {
      console.error('❌ server-setting コマンドエラー:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '⚠️ サーバー設定中にエラーが発生しました。',
          flags: 64,
        });
      }
    }
  },
};
