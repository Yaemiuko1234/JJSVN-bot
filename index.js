require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
  EmbedBuilder,
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.GuildMember],
});

client.once('ready', () => {
  console.log(`[BOT] Online: ${client.user.tag}`);
  client.user.setActivity('/help', { type: 3 });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // ──────────────────────────────────────────────
  // /giverole @user <role>
  // ──────────────────────────────────────────────
  if (commandName === 'giverole') {
    await interaction.deferReply();

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.editReply('[!] Ban khong co quyen Manage Roles.');
    }

    const targetUser = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      return interaction.editReply('[!] Khong tim thay nguoi dung trong server.');
    }

    if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.editReply('[!] Bot khong co quyen Manage Roles.');
    }

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.editReply('[!] Role nay cao hon hoac bang role cao nhat cua bot.');
    }

    if (targetMember.roles.cache.has(role.id)) {
      return interaction.editReply(`[!] ${targetUser} da co role **${role.name}** roi.`);
    }

    try {
      await targetMember.roles.add(role);

      const embed = new EmbedBuilder()
        .setColor(role.color || 0x5865f2)
        .setTitle('[+] Gan role thanh cong')
        .addFields(
          { name: 'Nguoi nhan', value: `${targetUser}`, inline: true },
          { name: 'Role', value: `${role}`, inline: true },
          { name: 'Thuc hien boi', value: `${interaction.user}`, inline: true }
        )
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      // Ping nguoi nhan + ping role
      await interaction.channel.send({
        content: `${targetUser} ${role} - Ban vua duoc cap role **${role.name}**.`,
        allowedMentions: { users: [targetUser.id], roles: [role.id] },
      });
    } catch (err) {
      console.error('[ERR] giverole:', err);
      interaction.editReply('[!] Co loi xay ra khi gan role. Kiem tra lai quyen cua bot.');
    }
  }

  // ──────────────────────────────────────────────
  // /removerole @user <role>
  // ──────────────────────────────────────────────
  if (commandName === 'removerole') {
    await interaction.deferReply();

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.editReply('[!] Ban khong co quyen Manage Roles.');
    }

    const targetUser = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!targetMember) {
      return interaction.editReply('[!] Khong tim thay nguoi dung trong server.');
    }

    if (!targetMember.roles.cache.has(role.id)) {
      return interaction.editReply(`[!] ${targetUser} khong co role **${role.name}**.`);
    }

    if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.editReply('[!] Bot khong co quyen Manage Roles.');
    }

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.editReply('[!] Role nay cao hon hoac bang role cao nhat cua bot.');
    }

    try {
      await targetMember.roles.remove(role);

      const embed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('[-] Xoa role thanh cong')
        .addFields(
          { name: 'Nguoi dung', value: `${targetUser}`, inline: true },
          { name: 'Role', value: `${role}`, inline: true },
          { name: 'Thuc hien boi', value: `${interaction.user}`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[ERR] removerole:', err);
      interaction.editReply('[!] Co loi xay ra khi xoa role.');
    }
  }

  // ──────────────────────────────────────────────
  // /pingrole [message]
  // Gui thong bao vao ANNOUNCE_CHANNEL_ID voi format co dinh
  // ──────────────────────────────────────────────
  if (commandName === 'pingrole') {
    const tryoutRoleId      = process.env.TRYOUT_ROLE_ID;
    const announceChannelId = process.env.ANNOUNCE_CHANNEL_ID;
    const tryoutPingChannel = process.env.TRYOUT_PING_CHANNEL_ID;
    const infoChannelId     = process.env.INFO_CHANNEL_ID;

    // Kiem tra config day du
    if (!tryoutRoleId || !announceChannelId || !tryoutPingChannel || !infoChannelId) {
      return interaction.reply({
        content: '[!] Chua cau hinh day du bien moi truong trong file .env.',
        ephemeral: true,
      });
    }

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.MentionEveryone)) {
      return interaction.reply({
        content: '[!] Ban khong co quyen Mention Everyone / Roles.',
        ephemeral: true,
      });
    }

    // Ten server title lay tu option message, mac dinh la "jjsvn tryout"
    const serverTitle = interaction.options.getString('message') || 'jjsvn tryout';

    await interaction.deferReply({ ephemeral: true });

    const announceChannel = interaction.guild.channels.cache.get(announceChannelId);
    if (!announceChannel) {
      return interaction.editReply('[!] Khong tim thay ANNOUNCE_CHANNEL_ID trong server.');
    }

    // Format thong bao
    const content = [
      `Name: ${serverTitle}`,
      `Ping toi + ten ingame o trong <#${tryoutPingChannel}> | tryout - ping`,
      `Doc <#${infoChannelId}> | cong - thong - tin neu ban chua biet luat`,
      `<@&${tryoutRoleId}>`,
    ].join('\n');

    await announceChannel.send({
      content,
      allowedMentions: { roles: [tryoutRoleId] },
    });

    await interaction.editReply({ content: `[OK] Da gui thong bao vao <#${announceChannelId}>.` });
  }

  // ──────────────────────────────────────────────
  // /help
  // ──────────────────────────────────────────────
  if (commandName === 'help') {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('Danh sach lenh')
      .setDescription('Tat ca lenh deu la slash command — go / de dung')
      .addFields(
        {
          name: '`/giverole @user <role>`',
          value: 'Gan role cho nguoi dung -> ping nguoi nhan + ping role',
        },
        {
          name: '`/removerole @user <role>`',
          value: 'Xoa role khoi nguoi dung',
        },
        {
          name: '`/pingrole [message]`',
          value: 'Bot ping role tryout trong channel, kem tin nhan tuy chon',
        },
        {
          name: '`/help`',
          value: 'Hien bang lenh nay',
        }
      )
      .setFooter({ text: `Yeu cau boi ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

client.login(process.env.TOKEN);
