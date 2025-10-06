import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';

export async function createLogImage({ title, user, channel, count, action }) {
  const width = 700;
  const height = 250;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, width, height);

  // タイトル
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 28px "Segoe UI"';
  ctx.fillText(title, 30, 50);

  // 情報
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px "Segoe UI"';
  ctx.fillText(`🧍 実行者: ${user}`, 30, 100);
  ctx.fillText(`💬 チャンネル: #${channel}`, 30, 140);
  if (count) ctx.fillText(`🧹 件数: ${count}`, 30, 180);
  ctx.fillText(`📅 実行時刻: ${new Date().toLocaleString('ja-JP')}`, 30, 220);

  // ファイル保存
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
  const filePath = path.join(logsDir, `${channel}-${action}.png`);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);

  return filePath;
}
