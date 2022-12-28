module.exports = {
  Client: {
    TOKEN: "Token", // 你的機器人Token。
    ID: "Bot ID" // 你的機器人ID。
  },

  Handler: {
    GUILD_ID: "群組ID", // 要架設郵件系統的群組ID。
    CATEGORY_ID: "分類ID" // 創建郵件的自訂類別ID。註：你也可以使用 /setup 指令創建類別而不使用此設定。
  },

  Modmail: {
    INTERACTION_COMMAND_PERMISSIONS: ['Administrator'], // 能使用斜線指令的權限。
    MAIL_MANAGER_ROLES: ['身分組ID','身分組ID'], // 可以管理郵件的類別身分組。
    MENTION_MANAGER_ROLES_WHEN_NEW_MAIL_CREATED: true // 是否提及管理身分組(MANAGER_ROLES)。
  }
};
