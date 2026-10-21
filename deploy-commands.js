require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('giverole')
    .setDescription('Gan role cho nguoi dung roi ping ho va ping role')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('Nguoi dung can gan role').setRequired(true)
    )
    .addRoleOption((opt) =>
      opt.setName('role').setDescription('Role can gan').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('Xoa role khoi nguoi dung')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('Nguoi dung can xoa role').setRequired(true)
    )
    .addRoleOption((opt) =>
      opt.setName('role').setDescription('Role can xoa').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('pingrole')
    .setDescription('Bot ping role tryout trong channel')
    .addStringOption((opt) =>
      opt.setName('message').setDescription('Tin nhan kem theo (khong bat buoc)').setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Hien thi danh sach lenh cua bot'),
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('[CMD] Dang dang ky slash commands...');

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('[CMD] Dang ky slash commands thanh cong!');
  } catch (err) {
    console.error('[CMD] Loi khi dang ky commands:', err);
  }
})();
