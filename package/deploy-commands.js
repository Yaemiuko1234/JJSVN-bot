require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('giverole')
    .setDescription('Gán role cho người dùng rồi ping họ và ping role')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('Người dùng cần gán role').setRequired(true)
    )
    .addRoleOption((opt) =>
      opt.setName('role').setDescription('Role cần gán').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('Xóa role khỏi người dùng')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('Người dùng cần xóa role').setRequired(true)
    )
    .addRoleOption((opt) =>
      opt.setName('role').setDescription('Role cần xóa').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('pingrole')
    .setDescription('Bot ping role tryout trong channel')
    .addStringOption((opt) =>
      opt.setName('message').setDescription('Tin nhan kem theo (khong bat buoc)').setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Hiển thị danh sách lệnh của bot'),
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('⏳ Đang đăng ký slash commands...');

    // Đăng ký theo từng guild (server) — instant, không cần chờ 1 giờ
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('✅ Đăng ký slash commands thành công!');
  } catch (err) {
    console.error('❌ Lỗi khi đăng ký commands:', err);
  }
})();

