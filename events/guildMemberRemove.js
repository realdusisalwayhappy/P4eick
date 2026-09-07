const { Events } = require('discord.js');
const updateStatus = require('../utlis/updateStatus');

module.exports = {
    name: Events.GuildMemberRemove,
    execute(member) {
        updateStatus(member.client);
    }
};
