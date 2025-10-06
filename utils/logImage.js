import { createCanvas, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';

const fontPath = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
try {
  registerFont(fontPath, { family: 'DejaVuSans' });
  console.log(`🈶 フォント登録成功: ${fontPath}`);
} catch (err) {
  console.warn('⚠️ フォント登録スキップ:', err.message);
}

export async function createLogImage({ title, user, channel, count, action }) {
  const width = 720;
  const height = 260;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, width, height);

  // タイトル
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 30px "DejaVuSans"';
  ctx.fillText(title, 40, 60);

  // テキスト
  ctx.fillStyle = '#ffffff';
  ctx.font = '22px "DejaVuSans"';
  let y = 120;
  ctx.fillText(`🧍 実行者 : ${user}`, 40, y);
  y += 40;
  ctx.fillText(`💬 チャンネル : #${channel}`, 40, y);
  y += 40;
  if (count !== undefined) ctx.fillText(`🧹 件数 : ${count}`, 40, y);
  y += 40;
  ctx.fillText(
    `📅 実行時刻 : ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
    40,
    y
  );

  // 保存先
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

  const filePath = path.join(logsDir, `${channel}-${action}.png`);
  fs.writeFileSync(filePath, canvas.toBuffer('image/png'));

  return filePath;
}
