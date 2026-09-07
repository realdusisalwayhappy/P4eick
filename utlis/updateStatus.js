const { ActivityType } = require('discord.js');

function updateStatus(client) {
    if (!client?.user) return;

    const guilds = client.guilds.cache;
    const serverCount = guilds.size;

    let userCount = 0;
    guilds.forEach(g => {
        userCount += g.memberCount || 0;
    });

    client.user.setActivity(
        `${serverCount} servers | ${userCount.toLocaleString()} users`,
        { type: ActivityType.Watching }
    );
}

module.exports = updateStatus;
