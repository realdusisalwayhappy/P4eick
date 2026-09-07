const { Events } = require('discord.js');
const logger = require('../utils/fuck_logger');
const updateStatus = require('../utils/updateStatus');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        logger.divider();
        logger.success(`Logged in as ${client.user.tag}`);

        client.user.setPresence({ status: 'online' });

        updateStatus(client);
        setInterval(() => updateStatus(client), 30000);

        const commands = [];
        client.commands.forEach(cmd => commands.push(cmd.data.toJSON()));

        try {
            await client.application.commands.set(commands);
            logger.success('Registered slash commands globally');
            logger.divider();

        } catch (error) {
            logger.error('Error registering commands:', error.message);
        }
    }
};
