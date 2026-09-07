const { Events } = require('discord.js');
const updateStatus = require('../utils/updateStatus');

module.exports = {
    name: Events.GuildCreate,
    execute(guild) {
        updateStatus(guild.client);
    }
};
