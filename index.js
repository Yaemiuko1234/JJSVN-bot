require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
  EmbedBuilder,
} = require('discord.js');
const express = require('express');
const https   = require('https');
const http    = require('http');

// ──────────────────────────────────────────────
// Web server - bat buoc de Render khong ngat bot
// ──────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

app.get('/', (_req, res) => res.send('[OK] Bot is running.'));

app.listen(PORT, () => {
  console.log(`[WEB] Listening on port ${PORT}`);
});

// Self-ping moi 14 phut de Render khong sleep (chi can neu dung Free tier)
if (process.env.RENDER_URL) {
  setInterval(() => {
    const url = process.env.RENDER_URL;
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      console.log(`[PING] Self-ping -> ${res.statusCode}`);
    }).on('error', (err) => {
      console.error('[PING] Self-ping error:', err.message);
    });
  }, 14 * 60 * 1000); // 14 phut
}

// ──────────────────────────────────────────────
// Discord Client
// ──────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember, Partials.Message, Partials.Channel],
});

const PREFIX = '.';

// ──────────────────────────────────────────────
// Helper: xu ly lenh giverole
// ──────────────────────────────────────────────
async function handleGiveRole({ guild, targetUser, role, executor, replyFn, sendFn }) {
  const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

  if (!targetMember)
    return replyFn('[!] Khong tim thay nguoi dung trong server.');

  if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles))
    return replyFn('[!] Bot khong co quyen Manage Roles.');

  if (role.position >= guild.members.me.roles.highest.position)
    return replyFn('[!] Role nay cao hon hoac bang role cao nhat cua bot.');

  if (targetMember.roles.cache.has(role.id))
    return replyFn(`[!] ${targetUser} da co role **${role.name}** roi.`);

  try {
    await targetMember.roles.add(role);

    const embed = new EmbedBuilder()
      .setColor(role.color || 0x5865f2)
      .setTitle('[+] Gan role thanh cong')
      .addFields(
        { name: 'Nguoi nhan',    value: `${targetUser}`, inline: true },
        { name: 'Role',          value: `${role}`,       inline: true },
        { name: 'Thuc hien boi', value: `${executor}`,   inline: true }
      )
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    await replyFn({ embeds: [embed] });

    await sendFn({
      content: `${targetUser} ${role} - Ban vua duoc cap role **${role.name}**.`,
      allowedMentions: { users: [targetUser.id], roles: [role.id] },
    });
  } catch (err) {
    console.error('[ERR] giverole:', err);
    replyFn('[!] Co loi xay ra khi gan role. Kiem tra lai quyen cua bot.');
  }
}

// ──────────────────────────────────────────────
// Helper: xu ly lenh removerole
// ──────────────────────────────────────────────
async function handleRemoveRole({ guild, targetUser, role, executor, replyFn }) {
  const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

  if (!targetMember)
    return replyFn('[!] Khong tim thay nguoi dung trong server.');

  if (!targetMember.roles.cache.has(role.id))
    return replyFn(`[!] ${targetUser} khong co role **${role.name}**.`);

  if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles))
    return replyFn('[!] Bot khong co quyen Manage Roles.');

  if (role.position >= guild.members.me.roles.highest.position)
    return replyFn('[!] Role nay cao hon hoac bang role cao nhat cua bot.');

  try {
    await targetMember.roles.remove(role);

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('[-] Xoa role thanh cong')
      .addFields(
        { name: 'Nguoi dung',    value: `${targetUser}`, inline: true },
        { name: 'Role',          value: `${role}`,       inline: true },
        { name: 'Thuc hien boi', value: `${executor}`,   inline: true }
      )
      .setTimestamp();

    await replyFn({ embeds: [embed] });
  } catch (err) {
    console.error('[ERR] removerole:', err);
    replyFn('[!] Co loi xay ra khi xoa role.');
  }
}

// ──────────────────────────────────────────────
// Helper: xu ly lenh pingrole
// ──────────────────────────────────────────────
async function handlePingRole({ guild, member, serverTitle, replyFn, ephemeralFn }) {
  const tryoutRoleId      = process.env.TRYOUT_ROLE_ID;
  const announceChannelId = process.env.ANNOUNCE_CHANNEL_ID;
  const tryoutPingChannel = process.env.TRYOUT_PING_CHANNEL_ID;
  const infoChannelId     = process.env.INFO_CHANNEL_ID;

  if (!tryoutRoleId || !announceChannelId || !tryoutPingChannel || !infoChannelId)
    return ephemeralFn('[!] Chua cau hinh day du bien moi truong trong file .env.');

  if (!member.permissions.has(PermissionsBitField.Flags.MentionEveryone))
    return ephemeralFn('[!] Ban khong co quyen Mention Everyone / Roles.');

  const announceChannel = guild.channels.cache.get(announceChannelId);
  if (!announceChannel)
    return ephemeralFn('[!] Khong tim thay ANNOUNCE_CHANNEL_ID trong server.');

  const title = serverTitle || 'jjsvn tryout';

  const content = [
    `Name: ${title}`,
    `Ping toi + ten ingame o trong <#${tryoutPingChannel}> | tryout - ping`,
    `Doc <#${infoChannelId}> | cong - thong - tin neu ban chua biet luat`,
    `<@&${tryoutRoleId}>`,
  ].join('\n');

  await announceChannel.send({
    content,
    allowedMentions: { roles: [tryoutRoleId] },
  });

  await replyFn(`[OK] Da gui thong bao vao <#${announceChannelId}>.`);
}

// ──────────────────────────────────────────────
// Helper: tao embed help
// ──────────────────────────────────────────────
function buildHelpEmbed(tag) {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Danh sach lenh')
    .setDescription(`Slash command: go /  |  Prefix command: go ${PREFIX}`)
    .addFields(
      {
        name: `\`/giverole\` | \`${PREFIX}giverole @user <role>\``,
        value: 'Gan role cho nguoi dung -> ping nguoi nhan + ping role',
      },
      {
        name: `\`/removerole\` | \`${PREFIX}removerole @user <role>\``,
        value: 'Xoa role khoi nguoi dung',
      },
      {
        name: `\`/pingrole\` | \`${PREFIX}pingrole [ten server]\``,
        value: 'Bot ping role tryout trong channel, kem ten server tuy chon',
      },
      {
        name: `\`/help\` | \`${PREFIX}help\``,
        value: 'Hien bang lenh nay',
      }
    )
    .setFooter({ text: `Yeu cau boi ${tag}` })
    .setTimestamp();
}

// ──────────────────────────────────────────────
// Slash Commands
// ──────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, guild, member, user, channel } = interaction;

  // /giverole
  if (commandName === 'giverole') {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles))
      return interaction.reply({ content: '[!] Ban khong co quyen Manage Roles.', ephemeral: true });

    await interaction.deferReply();

    await handleGiveRole({
      guild,
      targetUser: interaction.options.getUser('user'),
      role:       interaction.options.getRole('role'),
      executor:   user,
      replyFn:    (v) => interaction.editReply(v),
      sendFn:     (v) => channel.send(v),
    });
  }

  // /removerole
  if (commandName === 'removerole') {
    if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles))
      return interaction.reply({ content: '[!] Ban khong co quyen Manage Roles.', ephemeral: true });

    await interaction.deferReply();

    await handleRemoveRole({
      guild,
      targetUser: interaction.options.getUser('user'),
      role:       interaction.options.getRole('role'),
      executor:   user,
      replyFn:    (v) => interaction.editReply(v),
    });
  }

  // /pingrole
  if (commandName === 'pingrole') {
    await interaction.deferReply({ ephemeral: true });

    await handlePingRole({
      guild,
      member,
      serverTitle: interaction.options.getString('message') || '',
      replyFn:     (v) => interaction.editReply({ content: v }),
      ephemeralFn: (v) => interaction.editReply({ content: v }),
    });
  }

  // /help
  if (commandName === 'help') {
    await interaction.reply({ embeds: [buildHelpEmbed(user.tag)], ephemeral: true });
  }
});

// ──────────────────────────────────────────────
// Prefix Commands (dau .)
// ──────────────────────────────────────────────
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;
  if (!message.guild) return;

  const args    = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // .giverole @user @role
  if (command === 'giverole') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles))
      return message.reply('[!] Ban khong co quyen Manage Roles.');

    const targetUser = message.mentions.users.first();
    const role       = message.mentions.roles.first();

    if (!targetUser || !role)
      return message.reply(`[!] Cu phap: \`${PREFIX}giverole @user @role\``);

    await handleGiveRole({
      guild:     message.guild,
      targetUser,
      role,
      executor:  message.author,
      replyFn:   (v) => message.reply(v),
      sendFn:    (v) => message.channel.send(v),
    });
  }

  // .removerole @user @role
  if (command === 'removerole') {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles))
      return message.reply('[!] Ban khong co quyen Manage Roles.');

    const targetUser = message.mentions.users.first();
    const role       = message.mentions.roles.first();

    if (!targetUser || !role)
      return message.reply(`[!] Cu phap: \`${PREFIX}removerole @user @role\``);

    await handleRemoveRole({
      guild:     message.guild,
      targetUser,
      role,
      executor:  message.author,
      replyFn:   (v) => message.reply(v),
    });
  }

  // .pingrole [ten server]
  if (command === 'pingrole') {
    const serverTitle = args.join(' ');

    await handlePingRole({
      guild:      message.guild,
      member:     message.member,
      serverTitle,
      replyFn:    (v) => message.reply(v),
      ephemeralFn:(v) => message.reply(v),
    });
  }

  // .help
  if (command === 'help') {
    await message.reply({ embeds: [buildHelpEmbed(message.author.tag)] });
  }
});

// ──────────────────────────────────────────────
// Ready
// ──────────────────────────────────────────────
client.once('ready', () => {
  console.log(`[BOT] Online: ${client.user.tag}`);
  client.user.setActivity('/help | .help', { type: 3 });
});

client.login(process.env.TOKEN);