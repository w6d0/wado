import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} from "discord.js";
import fetch from "node-fetch";
import { CookieJar } from "tough-cookie";
import fetchCookie from "fetch-cookie";
import { HttpsProxyAgent } from "https-proxy-agent";

export default {
  data: new SlashCommandBuilder()
    .setName("メール作成")
    .setDescription("一時メールアドレスを作成します (m.kuku.lu)"),

  async execute(interaction) {
    await interaction.deferReply({ flags: 64 });

    try {
      // ✅ .env に設定した日本プロキシURLを使う
      // 例: HTTPS_PROXY="http://jp-proxy.example.com:8080"
      const proxyUrl = process.env.HTTPS_PROXY;
      const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : null;

      // 🍪 Cookie管理
      const jar = new CookieJar();
      const Fetch = fetchCookie(fetch, jar);

      // 🌐 m.kuku.lu へ初回アクセス（Cookie取得）
      const init = await Fetch("https://m.kuku.lu", {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
        agent,
      });

      if (!init.ok)
        throw new Error(`初期接続に失敗 (${init.status}) - 日本IP制限の可能性があります`);

      // Cookie確認
      const cookies = await jar.getCookies("https://m.kuku.lu");
      const csrf = cookies.find((c) => c.key === "cookie_csrf_token")?.value;
      const session = cookies.find((c) => c.key === "cookie_sessionhash")?.value;

      if (!csrf || !session)
        throw new Error("cookie_csrf_token または cookie_sessionhash が取得できません。");

      // ✉️ メールアドレス作成
      const res = await Fetch(
        "https://m.kuku.lu/index.php?action=addMailAddrByAuto&nopost=1&by_system=1",
        {
          headers: {
            Cookie: `cookie_csrf_token=${csrf}; cookie_sessionhash=${session}`,
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36",
            Accept: "text/plain",
          },
          agent,
        }
      );

      let text = await res.text();
      text = text.replace(/^\s+|\s+$/g, "").substring(3).trim();

      if (!text.includes("@"))
        throw new Error("メールアドレスを取得できませんでした。");

      // 💬 Embed出力
      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle("📬 一時メールアドレスを作成しました")
        .setDescription(`\`\`\`yaml\n${text}\n\`\`\``)
        .addFields(
          { name: "📅 有効期限", value: "約20分間", inline: true },
          { name: "🌐 提供元", value: "[m.kuku.lu](https://m.kuku.lu/)", inline: true }
        )
        .setFooter({
          text: "※一時メールは自動削除されます。必要ならメモしてください。",
        });

      const btn = new ButtonBuilder()
        .setLabel("📨 メールボックスを開く")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://m.kuku.lu/mailbox/${text.split("@")[0]}/`);

      const row = new ActionRowBuilder().addComponents(btn);

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      console.error("メール作成エラー:", err);
      await interaction.editReply({
        content: `⚠️ メール作成に失敗しました。\n\`\`\`${err.message}\`\`\``,
      });
    }
  },
};
