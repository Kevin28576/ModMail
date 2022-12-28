const { QuickDB } = require('quick.db');
const colors = require('colors');
const ms = require('ms');
const db = new QuickDB({ filePath: "data/ModMail.sqlite" });
const projectVersion = require('./package.json').version || "未知版本";
const Enmap = require('enmap');
const config = require("./botconfig/config.js");

const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  PermissionsBitField,
  Partials,
  REST,
  Routes,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
  ApplicationCommandOptionType,
  bold,
  italic,
  codeBlock
} = require('discord.js');

// 創建新 Client:
const client = new Client(
  {
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildIntegrations,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildMessageTyping,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.DirectMessageReactions,
      GatewayIntentBits.DirectMessageTyping,
      GatewayIntentBits.MessageContent,
    ],
    partials: [
      Partials.Message,
      Partials.Channel,
      Partials.GuildMember,
      Partials.GuildScheduledEvent,
      Partials.User
    ],
    presence: {
      activities: [{
        name: "私訊我聯絡管理員!",
        type: 1,
        url: "https://activity.cloudxact.com/"
      }]
    },
    shards: "auto"
  }
);

// Host the bot:
require('http')
  .createServer((req, res) => res.end('Ready.'))
  .listen(3030);

const asciiText = `
███    ███  ██████  ██████  ███    ███  █████  ██ ██      
████  ████ ██    ██ ██   ██ ████  ████ ██   ██ ██ ██      
██ ████ ██ ██    ██ ██   ██ ██ ████ ██ ███████ ██ ██      
██  ██  ██ ██    ██ ██   ██ ██  ██  ██ ██   ██ ██ ██      
██      ██  ██████  ██████  ██      ██ ██   ██ ██ ███████ 
`.underline.blue + `機器人版本 ${projectVersion} 
`.underline.blue + `製作 By Krick#9685
`.underline.blue + `For Discord活動中心
`.underline.cyan;

console.log(asciiText);

// Variables checker:
console.log('[CONFIG] 正在檢查設定...'.blue)

const AuthentificationToken = config.Client.TOKEN || process.env.TOKEN;

if (!AuthentificationToken) {
  console.error("[ERROR] 你需要提供你的機器人Token!".red);
  return process.exit();
}

if (!config.Client.ID) {
  console.error("[ERROR] 你需要提供你的機器人ID!".red);
  return process.exit();
}

if (!config.Handler.GUILD_ID) {
  console.error("[ERROR] 你需要提供你的群組ID!".red);
  return process.exit();
}

if (!config.Handler.CATEGORY_ID) {
  console.warn("[WARN] 你應該提供Modmail類別ID!".yellow);
  console.warn("[WARN] 使用斜線指令 /setup 解決此問題，而不是改變config.js的內容設定。".yellow);
}

if (!config.Modmail.INTERACTION_COMMAND_PERMISSIONS.length) {
  console.error("[ERROR] 你需要為斜線指令提供至少一項權限!".red);
  return process.exit();
};

config.Modmail.MAIL_MANAGER_ROLES ??= [];

// Creating some slash commands:
const commands = [
  {
    name: 'ping',
    description: '查看機器人延遲',
  },

  {
    name: 'help',
    description: '查看幫助列表'
  },

  {
    name: 'commands',
    description: '查看可用指令列表'
  },

  {
    name: 'ban',
    description: '禁止特定用戶使用Modmail系統',
    options: [
      {
        name: "user",
        description: "要禁止的用戶",
        type: 6, // 說明抓取用戶
        required: true
      },
      {
        name: "reason",
        description: "禁止的原因",
        type: 3 // 說明這是STRING
      }
    ]
  },

  {
    name: 'unban',
    description: '取消禁止用戶使用Modmail系統',
    options: [
      {
        name: "user",
        description: "要取消禁止的用戶",
        type: 6, // 說明抓取用戶
        required: true
      }
    ]
  },

  {
    name: 'setup',
    description: '設置郵件分類系統'
  }
];

// 斜線指令處理程序:
const rest = new REST({ version: '10' })
  .setToken(process.env.TOKEN || config.Client.TOKEN);

(async () => {
  try {
    console.log('[HANDLER] (/)斜線指令處理中...'.brightYellow);

    await rest.put(
      Routes.applicationGuildCommands(config.Client.ID, config.Handler.GUILD_ID), { body: commands }
    );

    console.log('[HANDLER] 已成功建立 (/)斜線指令!'.brightGreen);
  } catch (error) {
    console.error(error);
  }
})();

// 登錄機器人:
client.login(AuthentificationToken)
  .catch((err) => {
    if (err.name === 'Error [DisallowedIntents]') {
      console.log(`[LOGIN] 機器人登入時未設定好意圖，導致無法登入。
            請到 https://discord.com/developers/applications/${config.Client.ID}/bot 開啟所有特權意圖。`.red);
    } else {
      console.log(`[LOGIN] 出現未知原因錯誤。\n完整錯誤：`.red);
      console.error(err);
    }

    console.log('[LOGIN] 登入失敗。將結束此程式...'.red);
    process.exit(1);
  });

// 一旦機器人準備好:
client.once('ready', async () => {
  console.log(`[READY] ${client.user.tag} 準備好了!!`.brightGreen);

  const guild = client.guilds.cache.get(config.Handler.GUILD_ID);

  if (!guild) {
    console.error('[CRASH] 群組無效! 或者可能群組有效，只是我不在群組中'.red);
    return process.exit();
  } else return;
});

// 如果有錯誤，這個處理它。
process.on('unhandledRejection', (reason, promise) => {
  console.error("[ANTI-CRASH] 發生錯誤並已成功處理: [unhandledRejection]".red);
  console.error(promise, reason);
});

process.on("uncaughtException", (err, origin) => {
  console.error("[ANTI-CRASH] 發生錯誤並已成功處理: [uncaughtException]".red);
  console.error(err, origin);
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
  console.error("[ANTI-CRASH] 發生錯誤並已成功處理: [uncaughtExceptionMonitor]".red);
  console.error(err, origin);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.commandName;

  // 斜線指令:
  if (command === "ping") {
    interaction.reply(
      {
        content: `${client.ws.ping} ms!`
      }
    );

  } else if (command === "help") {

    return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setAuthor(
              {
                name: client.user.tag,
                iconURL: client.user.displayAvatarURL(
                  {
                    dynamic: true
                  }
                )
              }
            )
            .setTitle("幫助選單:")
            .setDescription(`${bold("ModMail 版本" + projectVersion)}.`)
            .addFields(
              {
                name: "設置系統:",
                value: "如果你沒有在config.js文件中提供類別ID，請改用斜線指令 \`/setup\`。"
              },
              {
                name: "創建新郵件:",
                value: "要創建郵件，請私訊我任何東西，應該會使用你的帳戶ID自動創建郵件頻道。你也可以上傳圖片以及檔案。"
              },
              {
                name: "關閉郵件:",
                value: "如果你想從私訊關閉郵件，請點擊灰色按鈕關閉。否則，如果你想從文字頻道中關閉郵件，請到郵件頻道點擊紅色按鈕關閉。如果回應「此交互失敗」，請改用斜線指令 `/close`。"
              },
              {
                name: "禁止/取消禁止用戶使用ModMail系統:",
                value: "要禁止用戶，請使用斜線指令 `/ban`，若要解禁則使用 `/unban`。"
              }
            )
            .setColor('Blue')
            .setFooter(
              {
                text: "Discord活動中心 | 技術團隊"
              }
            )
        ],
        ephemeral: true
      }
    );

  } else if (command === "commands") {
    const totalCommands = [];

    commands.forEach((cmd) => {
      let arrayOfCommands = new Object();

      arrayOfCommands = {
        name: "/" + cmd.name,
        value: cmd.description
      };

      totalCommands.push(arrayOfCommands);
    });

    return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setAuthor(
              {
                name: client.user.tag,
                iconURL: client.user.displayAvatarURL(
                  {
                    dynamic: true
                  }
                )
              }
            )
            .setTitle("可用指令列表:")
            .addFields(totalCommands)
        ]
      }
    );

  } else if (command === "ban") {
    const user = interaction.options.get('user').value;

    let reason = interaction.options.get('reason');
    let correctReason;

    if (!reason) correctReason = '沒有提供任何理由!';
    if (reason) correctReason = reason.value;

    if (!interaction.member.permissions.has(
      PermissionsBitField.resolve(config.Modmail.INTERACTION_COMMAND_PERMISSIONS || []))
    ) return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setTitle('缺少權限!')
            .setDescription(`抱歉，我不能讓你使用這個指令，因為你需要 ${bold(config.Modmail.INTERACTION_COMMAND_PERMISSIONS.join(', '))} 權限!`)
            .setColor('Red')
            .setFooter(
              {
                text: "Discord活動中心 | 技術團隊"
              }
            )
        ],
        ephemeral: true
      }
    );

    const bannedCheck = await db.get(`banned_guild_${config.Handler.GUILD_ID}_user_${user}`);

    if (bannedCheck) return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setDescription(`該用戶已被禁止`)
            .setColor('Red')
            .setFooter(
              {
                text: "Discord活動中心 | 技術團隊"
              }
            )
        ],
        ephemeral: true
      }
    );

    await db.add(`banned_guild_${config.Handler.GUILD_ID}_user_${user}`, 1);
    await db.set(`banned_guild_${config.Handler.GUILD_ID}_user_${user}_reason`, correctReason);

    return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setDescription(`該用戶已被成功禁止!\n原因: ${bold(correctReason)}`)
            .setColor('Green')
            .setFooter(
              {
                text: "Discord活動中心 | 技術團隊"
              }
            )
        ],
        ephemeral: true
      }
    );

  } else if (command === "unban") {
    const user = interaction.options.get('user').value;

    if (!interaction.member.permissions.has(
      PermissionsBitField.resolve(config.Modmail.INTERACTION_COMMAND_PERMISSIONS || []))
    ) return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setTitle('缺少權限!')
            .setDescription(`抱歉，我不能讓你使用這個指令，因為你需要 ${bold(config.Modmail.INTERACTION_COMMAND_PERMISSIONS.join(', '))} 權限!`)
            .setColor('Red')
            .setFooter(
              {
                text: "Discord活動中心 | 技術團隊"
              }
            )
        ],
        ephemeral: true
      }
    );

    const bannedCheck = await db.get(`banned_guild_${config.Handler.GUILD_ID}_user_${user}`);

    if (!bannedCheck) return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setDescription(`該用戶已被取消禁止`)
            .setColor('Red')
            .setFooter(
              {
                text: "Discord活動中心 | 技術團隊"
              }
            )
        ],
        ephemeral: true
      }
    );

    await db.delete(`banned_guild_${config.Handler.GUILD_ID}_user_${user}`);
    await db.delete(`banned_guild_${config.Handler.GUILD_ID}_user_${user}_reason`);

    return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setDescription(`該用戶已成功解禁`)
            .setColor('Green')
            .setFooter(
              {
                text: "Discord活動中心 | 技術團隊"
              }
            )
        ],
        ephemeral: true
      }
    );

  } else if (command === "setup") {
    if (!interaction.member.permissions.has(
      PermissionsBitField.resolve(config.Modmail.INTERACTION_COMMAND_PERMISSIONS || []))
    ) return interaction.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setTitle('缺少權限!')
            .setDescription(`抱歉，我不能讓你使用這個指令，因為你需要 ${bold(config.Modmail.INTERACTION_COMMAND_PERMISSIONS.join(', '))} 權限!`)
            .setColor('Red')
            .setFooter(
              {
                text: "Discord活動中心 | 技術團隊"
              }
            )
        ],
        ephemeral: true
      }
    );

    const guild = client.guilds.cache.get(config.Handler.GUILD_ID);
    const category = guild.channels.cache.find(CAT => CAT.id === config.Handler.CATEGORY_ID || CAT.name === "ModMail");

    // 如果找到類別:
    if (category) {
      interaction.reply(
        {
          embeds: [
            new EmbedBuilder()
              .setDescription(`已經有一個名為ModMail的頻道類別。用新類別替換舊類別?\n\n：警告：如果點擊**替換**，所有郵件文字頻道將不在類別中。\n\n此請求將在10秒後過期，按鈕將不會在10秒後回應你的操作。`)
              .setColor('Red')
              .setFooter(
                {
                  text: "Discord活動中心 | 技術團隊"
                }
              )
          ],
          components: [
            new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('replace_button_channel_yes')
                  .setLabel('替換')
                  .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                  .setCustomId('replace_button_channel_no')
                  .setLabel('取消')
                  .setStyle(ButtonStyle.Danger),
              )
          ],
          ephemeral: true
        }
      );

      const collectorREPLACE_CHANNEL = interaction.channel.createMessageComponentCollector({
        time: 10000
      });

      collectorREPLACE_CHANNEL.on('collect', async (i) => {
        const ID = i.customId;

        if (ID == "replace_button_channel_yes") {
          i.update(
            {
              embeds: [
                new EmbedBuilder()
                  .setDescription(`正在創建新類別...這可能需要一段時間!`)
                  .setColor('Yellow')
                  .setFooter(
                    {
                      text: "Discord活動中心 | 技術團隊"
                    }
                  )
              ],
              components: [
                new ActionRowBuilder()
                  .addComponents(
                    new ButtonBuilder()
                      .setCustomId('replace_button_channel_yes')
                      .setLabel('替換')
                      .setStyle(ButtonStyle.Success)
                      .setDisabled(true),
                    new ButtonBuilder()
                      .setCustomId('replace_button_channel_no')
                      .setLabel('取消')
                      .setStyle(ButtonStyle.Danger)
                      .setDisabled(true),
                  )
              ]
            }
          );

          await category.delete();

          const channel = await guild.channels.create({
            name: "ModMail",
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
              {
                id: guild.roles.everyone,
                deny: [PermissionFlagsBits.ViewChannel],
              },
            ]
          }).catch(console.log);

          let roles = [];

          if (config.Modmail.MAIL_MANAGER_ROLES) {
            config.Modmail.MAIL_MANAGER_ROLES.forEach(async (role) => {
              const roleFetched = guild.roles.cache.get(role);
              if (!roleFetched) return roles.push('[INVALID ROLE]');

              roles.push(roleFetched);

              await channel.permissionOverwrites.create(roleFetched.id, {
                SendMessages: true,
                ViewChannel: true,
                AttachFiles: true
              })
            });
          } else {
            roles.push("config.js文件中未添加任何支持身分組");
          }

          interaction.editReply(
            {
              embeds: [
                new EmbedBuilder()
                  .setDescription(`完成，成功創建了一個名為 **ModMail**的郵件類別。`)
                  .addFields(
                    { name: "身分組", value: roles.join(', ') + "." }
                  )
                  .setFooter(
                    {
                      text: "WARN: 請檢查類別中的身分組，系統可能會發生錯誤導致身分組權限給予錯誤。"
                    }
                  )
                  .setColor('Green')
                  .setFooter(
                    {
                      text: "Discord活動中心 | 技術團隊"
                    }
                  )
              ]
            }
          );

          return collectorREPLACE_CHANNEL.stop();
        } else if (ID == "replace_button_channel_no") {
          i.update(
            {
              embeds: [
                new EmbedBuilder()
                  .setDescription(`取消`)
                  .setFooter(
                    {
                      text: "你現在可以點擊此嵌入訊息下方的關閉訊息。"
                    }
                  )
                  .setColor('Green')
                  .setFooter(
                    {
                      text: "Discord活動中心 | 技術團隊"
                    }
                  )
              ],
              components: [
                new ActionRowBuilder()
                  .addComponents(
                    new ButtonBuilder()
                      .setCustomId('replace_button_channel_yes')
                      .setLabel('替換')
                      .setStyle(ButtonStyle.Success)
                      .setDisabled(true),
                    new ButtonBuilder()
                      .setCustomId('replace_button_channel_no')
                      .setLabel('取消')
                      .setStyle(ButtonStyle.Danger)
                      .setDisabled(true),
                  )
              ],
            }
          );

          return collectorREPLACE_CHANNEL.stop();
        } else return;
      })

      // 如果未找到類別:
    } else {
      interaction.reply(
        {
          embeds: [
            new EmbedBuilder()
              .setDescription(`創建新類別...這可能需要一段時間!`)
              .setColor('Yellow')
              .setFooter(
                {
                  text: "Discord活動中心 | 技術團隊"
                }
              )
          ]
        }
      );

      const channel = await guild.channels.create({
        name: "ModMail",
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: [PermissionFlagsBits.ViewChannel],
          },
        ]
      }).catch(console.log);

      let roles = [];

      if (config.Modmail.MAIL_MANAGER_ROLES) {
        config.Modmail.MAIL_MANAGER_ROLES.forEach(async (role) => {
          const roleFetched = guild.roles.cache.get(role);
          if (!roleFetched) return roles.push('[INVALID ROLE]');

          roles.push(roleFetched);

          await channel.permissionOverwrites.create(roleFetched.id, {
            SendMessages: true,
            ViewChannel: true,
            AttachFiles: true
          })
        });
      } else {
        roles.push("config.js文件中未添加任何支持身分組");
      }

      return interaction.editReply(
        {
          embeds: [
            new EmbedBuilder()
              .setDescription(`完成，成功創建了一個名為 **ModMail**的郵件類別。`)
              .addFields(
                { name: "身分組", value: roles.length ? roles.join(', ') + "." : '並未設置身分組。' }
              )
              .setFooter(
                {
                  text: "WARN: 請檢查類別中的身分組，系統可能會發生錯誤導致身分組權限給予錯誤。"
                }
              )
              .setColor('Green')
              .setFooter(
                {
                  text: "Discord活動中心 | 技術團隊"
                }
              )
          ]
        }
      );
    }

  } else return;
});

// ModMail 系統:
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const guild = client.guilds.cache.get(config.Handler.GUILD_ID);

  if (!guild) {
    console.error('[CRASH] 群組無效'.red);
    return process.exit();
  }

  const category = guild.channels.cache.find(CAT => CAT.id === config.Handler.CATEGORY_ID || CAT.name === "ModMail");

  const channel = guild.channels.cache.find(
    x => x.name === message.author.id && x.parentId === category.id
  );

  const bannedUserCheck = await db.get(`banned_guild_${config.Handler.GUILD_ID}_user_${message.author.id}`);

  // If the message in a DM channel:
  if (message.channel.type == ChannelType.DM) {
    if (bannedUserCheck) {
      const reason = await db.get(`banned_guild_${config.Handler.GUILD_ID}_user_${message.author.id}_reason`);

      return message.reply(
        {
          embeds: [
            new EmbedBuilder()
              .setTitle("郵件創建失敗:")
              .setDescription(`抱歉，我們無法為你創建郵件，因為你 ${bold('已被管理員封禁')} 而無法使用ModMail系統!`)
              .addFields(
                { name: '封禁的原因', value: italic(reason) }
              )
          ]
        }
      );
    };

    if (!category) return message.reply(
      {
        embeds: [
          new EmbedBuilder()
            .setDescription("系統還沒有準備好!")
            .setColor("Red")
            .setFooter(
              {
                text: "Discord活動中心 | 技術團隊"
              }
            )
        ]
      }
    );

    // Modmail 系統:
    if (!channel) {
      let embedDM = new EmbedBuilder()
        .setTitle("郵件創建:")
        .setDescription(`你的郵件已成功創建，郵件詳細資料如下:`)
        .addFields(
          { name: "訊息", value: `${message.content || italic("(此訊息僅圖片)")}` },
          { name: "請注意", value: `<a:DiscordError:1003543838318665748>==============================<a:DiscordError:1003543838318665748>\n由於現在所有客服人員及團隊人員皆忙線中\n為避免造成困擾請勿一直發送相同訊息\n以免造成他人困擾，並請提供你目前遇到的問題及詳細資訊\n好讓我們的團隊人員可以盡速的為你提供服務。\n<a:DiscordError:1003543838318665748>==============================<a:DiscordError:1003543838318665748>` }
        )
        .setColor('Green')
        .setFooter(
          {
            text: "Discord活動中心 | 技術團隊"
          }
        )

      if (message.attachments.size) {
        embedDM.setImage(message.attachments.map(img => img)[0].proxyURL);
        embedDM.addFields(
          { name: "檔案", value: italic("(在此訊息下方)") }
        )
      };
      
      message.reply(
        {
          embeds: [
            embedDM
          ],
          components: [
            new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('close_button_created_mail_dm')
                  .setLabel('關閉郵件')
                  .setEmoji('1003543818978734112')
                  .setStyle(ButtonStyle.Secondary),
              )
          ]
        }
      );

      const channel = await guild.channels.create({
        //name: message.author.tag,
        name: message.author.id,
        type: ChannelType.GuildText,
        parent: category,
        topic: `此郵件頻道由 ${message.author.tag} 創建。`
      }).catch(console.log);

      let embed = new EmbedBuilder()
        .setTitle("新郵件:")
        .addFields(
          { name: "創建用戶", value: `${message.author.tag} (\`${message.author.id}\`)` },
          { name: "訊息", value: `${message.content.substr(0, 4096) || italic("(此訊息僅圖片)")}` },
          { name: "創建於", value: `${new Date().toLocaleString()}` },
        )
        .setColor('Blue')
        .setFooter(
          {
            text: "Discord活動中心 | 技術團隊"
          }
        )

      if (message.attachments.size) {
        embed.setImage(message.attachments.map(img => img)[0].proxyURL);
        embed.addFields(
          { name: "檔案", value: italic("(在此訊息下方)") }
        )
      };

      const ROLES_TO_MENTION = [];
      config.Modmail.MAIL_MANAGER_ROLES.forEach((role) => {
        if (!config.Modmail.MAIL_MANAGER_ROLES || !role) return ROLES_TO_MENTION.push('[ERROR: 未提供任何身分組]')
        if (config.Modmail.MENTION_MANAGER_ROLES_WHEN_NEW_MAIL_CREATED == false) return;

        const ROLE = guild.roles.cache.get(role);
        if (!ROLE) return;
        ROLES_TO_MENTION.push(ROLE);
      });

      return channel.send(
        {
          content: config.Modmail.MENTION_MANAGER_ROLES_WHEN_NEW_MAIL_CREATED ? ROLES_TO_MENTION.join(', ') : "** **",
          embeds: [
            embed
          ],
          components: [
            new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('close_button_created_mail_channel')
                  .setLabel('關閉郵件')
                  .setEmoji('1003543818978734112')
                  .setStyle(ButtonStyle.Danger),
              )
          ]
        }
      ).then(async (sent) => {
        sent.pin();
      });

    } else {
      let embed = new EmbedBuilder()
        .setAuthor({ name: `${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setDescription(message.content.substr(0, 4096) || italic("(此訊息僅圖片)"))
        .setColor('Green')
        .setFooter(
          {
            text: "Discord活動中心 | 技術團隊"
          }
        );

      if (message.attachments.size) embed.setImage(message.attachments.map(img => img)[0].proxyURL);

      message.react("📨");

      return channel.send(
        {
          embeds: [
            embed
          ]
        }
      );
    }

    // 如果訊息屬於Modmail類別:
  } else if (message.channel.type === ChannelType.GuildText) {
    if (!category) return;
    
    if (message.channel.parentId === category.id) {
      const requestedUserMail = guild.members.cache.get(`${message.channel.name}`);
      //console.log(message.channel.name)
      let embed = new EmbedBuilder()
        .setAuthor({ name: `${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setDescription(message.content.substr(0, 4096) || italic("(此訊息僅圖片)"))
        .setColor('Red')
        .setFooter(
          {
            text: "Discord活動中心 | 技術團隊"
          }
        );

      if (message.attachments.size) embed.setImage(message.attachments.map(img => img)[0].proxyURL);

        try {
          await requestedUserMail.send(
            {
              embeds: [
                embed
              ]
            }
          ),
          message.react("📨")
        } catch (error) {
          message.react("❌")
          message.channel.send(`發生錯誤:\n${error}`)
          console.error(error)
        }
      
    } else return;
  }
});

// 按鈕和modal處理程序:
client.on('interactionCreate', async (interaction) => {

  // 按鈕:
  if (interaction.isButton()) {
    const ID = interaction.customId;

    if (ID == "delete_button_created_mail_channel") {
      interaction.channel.delete()
    }
    // 文字頻道中的關閉按鈕:
    if (ID == "close_button_created_mail_channel") {
      const modal = new ModalBuilder()
        .setCustomId('modal_close')
        .setTitle('關閉郵件');

      const REASON_TEXT_INPUT = new TextInputBuilder()
        .setCustomId('modal_close_variable_reason')
        .setLabel("關閉郵件的原因")
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const ACTION_ROW = new ActionRowBuilder()
        .addComponents(REASON_TEXT_INPUT);

      modal.addComponents(ACTION_ROW);

      await interaction.showModal(modal);

      // DM 中的關閉按鈕:
    } else if (ID == "close_button_created_mail_dm") {
      const guild = client.guilds.cache.get(config.Handler.GUILD_ID);

      const category = guild.channels.cache.find(CAT => CAT.id === config.Handler.CATEGORY_ID || CAT.name === "ModMail");

      const channelRECHECK = guild.channels.cache.find(
        x => x.name === interaction.user.id && x.parentId === category.id
      );

      if (!channelRECHECK) return interaction.reply(
        {
          embeds: [
            new EmbedBuilder()
              .setDescription(`此郵件已被關閉!`)
              .setColor('Yellow')
              .setFooter(
                {
                  text: "Discord活動中心 | 技術團隊"
                }
              )
          ],
          ephemeral: true
        }
      );
      let agree_embed = new EmbedBuilder()
        .setDescription("```郵件控制```")
        .setColor('Red')
        .setFooter(
          {
            text: "Discord活動中心 | 技術團隊"
          }
        )
        channelRECHECK.send(
          {
            embeds: [
              agree_embed
            ],
            components: [
              new ActionRowBuilder()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId('delete_button_created_mail_channel')
                    .setLabel('刪除郵件')
                    .setStyle(ButtonStyle.Danger),
                )
            ]
          }
        )
        
        .then(async (ch) => {
          if (!ch) return; //! 千萬不要碰! 這非常重要，如果你刪除了這行代碼，會導致你在關閉郵件時會一直重複私訊用戶!!

          return interaction.reply(
            {
              embeds: [
                new EmbedBuilder()
                  .setTitle('郵件已關閉!')
                  .setDescription(`你的郵件已成功關閉。`)
                  .setColor('Green')
                  .setFooter(
                    {
                      text: "Discord活動中心 | 技術團隊"
                    }
                  )
              ]
            }
          );
        });
    } else return;

    // MODALS:
  } else if (interaction.type === InteractionType.ModalSubmit) {
    const ID = interaction.customId;

    if (ID == "modal_close") {
      const guild = client.guilds.cache.get(config.Handler.GUILD_ID);

      const requestedUserMail = guild.members.cache.get(interaction.channel.name);

      let reason = interaction.fields.getTextInputValue('modal_close_variable_reason');
      if (!reason) reason = "沒有提供任何理由!";

      let agree_embed = new EmbedBuilder()
          .setDescription("```郵件控制```")
          .setColor('Red')
          .setFooter(
            {
              text: "Discord活動中心 | 技術團隊"
            }
          )
      interaction.reply(
        {
          embeds: [
            agree_embed
          ],
          components: [
            new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('delete_button_created_mail_channel')
                  .setLabel('刪除郵件')
                  .setStyle(ButtonStyle.Danger),
              )
          ]
        }
      )
        
        .then(async (ch) => {
          if (!ch) return; //! 千萬不要碰! 這非常重要，如果你刪除了這行代碼，會導致你在關閉郵件時會一直重複私訊用戶!!
          return await requestedUserMail.send(
            {
              embeds: [
                new EmbedBuilder()
                  .setTitle('郵件已關閉!')
                  .setDescription(`你的郵件已成功關閉。`)
                  .addFields(
                    { name: "關閉原因", value: `${italic(reason)}` }
                  )
                  .setColor('Green')
                  .setFooter(
                    {
                      text: "Discord活動中心 | 技術團隊"
                    }
                  )
              ]
            }
          );
        });
    } else return;
  } else return;
});

