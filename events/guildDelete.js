const { Events } = require('discord.js');
const updateStatus = require('../utlis/updateStatus');

module.exports = {
    name: Events.GuildDelete,
    execute(guild) {
        updateStatus(guild.client);
    }
};
