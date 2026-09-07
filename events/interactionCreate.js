const { Events } = require('discord.js');
const logger = require('../utlis/fuck_logger');

async function respondWithError(interaction, content) {
    const response = { content, ephemeral: true };
    try {
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(response);
        } else {
            await interaction.reply(response);
        }
    } catch (replyError) {
        logger.error('Failed to send interaction error response');
        logger.error(replyError);
    }
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        logger.info(`[InteractionCreate] type=${interaction.type} name=${interaction.commandName || ''} customId=${interaction.customId || ''}`);
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) {
                logger.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                logger.error(`Error executing ${interaction.commandName}`);
                logger.error(error);

                const responseData = { content: 'There was an error while executing this command!', flags: 64 };
                if (interaction.replied || interaction.deferred) await interaction.followUp(responseData);
                else await interaction.reply(responseData);
            }
        } else if (interaction.isButton()) {
            const commandName = interaction.message.interaction?.commandName || 'quest';
            const command = interaction.client.commands.get(commandName);

            if (command && command.handleButton) {
                try {
                    await command.handleButton(interaction);
                } catch (error) {
                    logger.error(`Error handling button ${interaction.customId}`);
                    logger.error(error);
                    await respondWithError(interaction, '❌ เปิดหน้าต่างไม่ได้ กรุณาตรวจสอบ console log');
                }
            } else {
                logger.warn(`No handler found for button ${interaction.customId}`);
                await respondWithError(interaction, '❌ ไม่พบตัวจัดการปุ่มนี้');
            }
        } else if (interaction.isModalSubmit()) {
            const commandName = interaction.message?.interaction?.commandName || 'quest';
            const command = interaction.client.commands.get(commandName);

            if (command && command.handleModal) {
                try {
                    await command.handleModal(interaction);
                } catch (error) {
                    logger.error(`Error handling modal ${interaction.customId}`);
                    logger.error(error);
                    await respondWithError(interaction, '❌ ประมวลผลฟอร์มไม่ได้ กรุณาตรวจสอบ console log');
                }
            } else {
                await respondWithError(interaction, '❌ ไม่พบตัวจัดการฟอร์มนี้');
            }
        } else if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (command && command.autocomplete) {
                try {
                    await command.autocomplete(interaction);
                } catch (error) {
                    logger.error(`Error handling autocomplete for ${interaction.commandName}`);
                    logger.error(error);
                }
            }
        }
    }
};
