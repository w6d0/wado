import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import fetch from "node-fetch";
import { CookieJar } from "tough-cookie";
import fetchCookie from "fetch-cookie";

const Fetch = fetchCookie(fetch);

export default {
  data: new SlashCommandBuilder()
    .setName("メール作成")
    .setDescription("一時メールアドレスを作成します (m.kuku.lu)"),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    try {
      // ===== ステップ①: kukulu にアクセスして Cookie 取得 =====
      const jar = new CookieJar();
      await Fetch("https://m.kuku.lu", { method: "POST", redirect: "follow", jar });
      const cookies = await jar.getCookies("https://m.kuku.lu");

      const csrfToken = cookies.find(c => c.key === "cookie_csrf_token")?.value;
      const sessionHash = cookies.find(c => c.key === "cookie_sessionhash")?.value;

      if (!csrfToken || !sessionHash) throw new Error("Cookie取得に失敗しました。");

      // ===== ステップ②: 自動生成リクエスト送信 =====
      const res = await Fetch(
        "https://m.kuku.lu/index.php?action=addMailAddrByAuto&nopost=1&by_system=1",
        { headers: { Cookie: `cookie_csrf_token=${csrfToken}; cookie_sessionhash=${sessionHash}` } }
      );

      let text = await res.text();
      text = text.replace(/^\s+|\s+$/g, "").substring(3); // 先頭の "===" 部分を除去
      const address = text.trim();

      if (!address.includes("@")) throw new Error("メールアドレスの生成に失敗しました。");

      // ===== Embed構築 =====
      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle("📬 一時メールアドレスを作成しました")
        .setDescription(`\`\`\`yaml\n${address}\n\`\`\``)
        .addFields(
          { name: "📅 有効期限", value: "約20分間", inline: true },
          { name: "🌐 提供元", value: "[m.kuku.lu](https://m.kuku.lu/)", inline: true }
        )
        .setFooter({ text: "※一時メールは自動削除されます。保存しておきましょう。" });

      const openBtn = new ButtonBuilder()
        .setLabel("📨 メールボックスを開く")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://m.kuku.lu/mailbox/${address.split("@")[0]}/`);

      const row = new ActionRowBuilder().addComponents(openBtn);

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      console.error("メール作成エラー:", err);
      await interaction.editReply({ content: `⚠️ メール作成に失敗しました。\n\`\`\`${err.message}\`\`\`` });
    }
  },
};
