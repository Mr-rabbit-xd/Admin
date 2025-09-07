import { Telegraf } from "telegraf";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

// --- CONFIG ---
const BOT_TOKEN = "8267834386:AAF9ZEBOFHs_D205nHVQ3EZnR2fo0mPN_yY"; // এখানে তোমার SUPPORT BOT TOKEN বসাও
const ADMIN_ID = 7616539095; // এখানে তোমার Telegram ID বসাও (MR RABBIT)

// --- INIT ---
const bot = new Telegraf(BOT_TOKEN);

// --- DB Setup ---
const adapter = new JSONFile("db.json");
const db = new Low(adapter, { users: [] });
await db.read();

// --- Set Bot Commands Menu (only /start) ---
bot.telegram.setMyCommands([
  { command: "start", description: "Start the bot" }
]);

// --- Start Command ---
bot.start(async (ctx) => {
  const userId = ctx.from.id;
  if (!db.data.users.includes(userId)) {
    db.data.users.push(userId);
    await db.write();
  }

  ctx.reply(
    "👋 Welcome! This is the Prediction Support Bot.\n\n" +
    "If you face any issue, just type here.\n" +
    "📩 Your message will be sent to MR RABBIT."
  );
});

// --- Handle All User Messages ---
bot.on("message", async (ctx) => {
  const userId = ctx.from.id;
  const userName = ctx.from.username || ctx.from.first_name;
  const messageText = ctx.message.text || "📎 Media/Attachment";

  // Save user to db if not exists
  if (!db.data.users.includes(userId)) {
    db.data.users.push(userId);
    await db.write();
  }

  // 1. Forward to Admin (Bangla)
  await ctx.telegram.sendMessage(
    ADMIN_ID,
    `📩 নতুন মেসেজ পাওয়া গেছে\n\n👤 প্রেরক: ${userName}\n🆔 আইডি: ${userId}\n\n💬 মেসেজ:\n${messageText}`
  );

  // 2. Send temporary confirmation to User (English)
  const sentMsg = await ctx.reply("✅ Your message has been sent to MR RABBIT.");

  // 3. Auto delete confirmation after 5 sec
  setTimeout(() => {
    ctx.deleteMessage(sentMsg.message_id).catch(() => {});
  }, 5000);
});

// --- Admin Reply to User ---
bot.command("send", async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;

  const args = ctx.message.text.split(" ");
  const targetId = args[1];
  const replyMsg = args.slice(2).join(" ");

  if (!targetId || !replyMsg) {
    return ctx.reply("⚠️ Usage: /send <userId> <message>");
  }

  try {
    await ctx.telegram.sendMessage(
      targetId,
      `💬 MR RABBIT: ${replyMsg}`
    );
    ctx.reply("✅ Reply sent successfully.");
  } catch (err) {
    ctx.reply("❌ Failed to send message to the user.");
  }
});

// --- Broadcast (Admin only) ---
bot.command("broadcast", async (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;

  const message = ctx.message.text.split(" ").slice(1).join(" ");
  if (!message) return ctx.reply("⚠️ Usage: /broadcast <message>");

  let success = 0;
  let failed = 0;

  for (const userId of db.data.users) {
    try {
      await ctx.telegram.sendMessage(userId, `📢 MR RABBIT Broadcast:\n\n${message}`);
      success++;
    } catch (err) {
      failed++;
    }
  }

  ctx.reply(`🚀 Broadcast done!\n✅ Success: ${success}\n❌ Failed: ${failed}`);
});

// --- Launch Bot ---
bot.launch();
console.log("✅ Support Bot with Broadcast is running...");
