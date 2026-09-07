const { Events } = require('discord.js');
const updateStatus = require('../utlis/updateStatus');

module.exports = {
    name: Events.GuildMemberAdd,
    execute(member) {
        updateStatus(member.client);
    }
};
