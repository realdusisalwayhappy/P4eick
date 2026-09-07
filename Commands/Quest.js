const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const cv2 = require('../utils/componentsv2');
const questHandler = require('../models/questHandler');
const logger = require('../utils/fuck_logger');
const { checkOwner } = require('../utils/checkowner');

const BANNER_URL =
'https://s.imgz.io/2026/08/13/IMG_608581fc1cf3b101be5b.png';
const LOG_CHANNEL_ID = '1540933196890251375';
const LOG_CHANNEL_ID2 = '1540938642887811102';
const OWNER_ID = process.env.OWNER_ID;

async function sendComponentsV2(channelId, components, client) {
    const IS_COMPONENTS_V2 = 1 << 15;

    await client.rest.post(`/channels/${channelId}/messages`, {
        body: {
            flags: IS_COMPONENTS_V2,
            components: Array.isArray(components) ? components : [components]
        }
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quest')
        .setDescription('🔥 AUTO QUEST PREMIUM SYSTEM'),

    async execute(interaction) {
        if (await checkOwner(interaction)) return;

        const questUI = [
            cv2.container({
                color: 0x101010,
                components: [

                    cv2.text('## <a:928014477973135400:1532669736033189938> **AUTO QUEST SYSTEM** <a:854798697535504424:1532669718983606294>'),
                    cv2.separator(),

                    cv2.text('```ansi\n\u001b[2;31mPREMIUM PANEL ENABLED\u001b[0m```'),

                    cv2.text(
                        '**<a:confetti:1535250262652887090> ระบบทำเคสออโต้เวอร์ชั่นฟรี**\n' +
                        '**<a:YELOCOY5:1532677157837475931> รองรับหลาย TOKEN พร้อมกัน**\n' +
                        '**<a:ww:1532669871941488813> กดปุ่มด้านล่างเพื่อเริ่มทันที**'
                    ),

                    cv2.separator(),

                    cv2.actionRow(
                        cv2.button({
                            id: 'full_auto_quest',
                            label: 'START NOW',
                            style: cv2.ButtonStyle.SECONDARY,
                            emoji: { id: '1532669871941488813' }
                        }),

                        cv2.button({
                            id: 'show_ended_page',
                            label: 'ENDED PAGE',
                            style: cv2.ButtonStyle.SECONDARY,
                            emoji: { id: '1517349461184086090' }
                        })
                    ),

                    cv2.separator(),

                    cv2.text('**POWERED BY AUTOQUEST PREMIUM**'),

                    cv2.separator(),

                    cv2.mediaGallery([{ url: BANNER_URL }])
                ]
            })
        ];

        await interaction.reply({
            content: '✅ PANEL SENT.',
            flags: 64
        });

        await sendComponentsV2(interaction.channelId, questUI, interaction.client);
    },

    async handleButton(interaction) {
        if (interaction.customId === 'full_auto_quest') {
            const modal = cv2.modal({
                id: 'full_auto_modal',
                title: '🔥 AUTO QUEST LOGIN',
                components: [
                    cv2.actionRow(
                        cv2.textInput({
                            id: 'token_input',
                            label: 'DISCORD TOKENS',
                            placeholder: '1 TOKEN ต่อ 1 บรรทัด',
                            style: cv2.TextInputStyle.PARAGRAPH,
                            required: true
                        })
                    )
                ]
            });

            return interaction.showModal(modal);
        }

        if (interaction.customId === 'show_ended_page') {
            if (interaction.user.id !== OWNER_ID) {
                return interaction.reply({
                    content: '**<a:emoji_7:1532677196857086112> คุณไม่มีสิทธิ์ใช้ปุ่มนี้ เฉพาะเจ้าของบอทเท่านั้นครับ**',
                    flags: 64
                });
            }

            const endedPage = [
                cv2.container({
                    color: 0x111111,
                    components: [

                        cv2.text('## <a:emoji_7:1517349461184086090> **AUTO QUEST SYSTEM**'),
                        cv2.separator(),

                        cv2.text('```ansi\n\u001b[2;31mSTATUS : ENDED\u001b[0m```'),

                        cv2.text(
                            '**<a:1YELOCOY4:1532677088908283912> ระบบปิดใช้งานชั่วคราว**\n' +
                            '**<a:emoji_48:1532677186828505180> กรุณารอ OWNER เปิดใหม่**'
                        ),

                        cv2.separator(),

                        cv2.actionRow(
                            cv2.button({
                                id: 'disabled_btn',
                                label: 'UNAVAILABLE',
                                style: cv2.ButtonStyle.DANGER,
                                disabled: true,
                                emoji: { id: '1517349461184086090' }
                            })
                        ),

                        cv2.separator(),

                        cv2.mediaGallery([{ url: BANNER_URL }])
                    ]
                })
            ];

            return sendComponentsV2(
                interaction.channelId,
                endedPage,
                interaction.client
            );
        }
    },

    async handleModal(interaction) {
        if (interaction.customId !== 'full_auto_modal') return;

        await interaction.deferReply({ flags: 64 });

        const tokenInput = interaction.fields.getTextInputValue('token_input');

        const tokens = tokenInput
            .split(/[\n,]+/)
            .map(t => t.trim())
            .filter(Boolean);

        if (!tokens.length) {
            return interaction.editReply({
                content: '❌ **ไม่พบ TOKEN**',
                flags: 64
            });
        }

        const successEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setDescription(
                `✅ **LOGIN SUCCESS**\n` +
                `**จำนวน TOKEN:** ${tokens.length}\n` +
                `**คลิกปุ่มด้านล่างเพื่อเช็คสถานะ**`
            )
            .setImage(BANNER_URL)
            .setTimestamp()
            .setFooter({ text: 'AUTO QUEST SYSTEM' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('CHECK STATUS')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/channels/${interaction.guildId}/${LOG_CHANNEL_ID}`)
            );

        await interaction.editReply({
            embeds: [successEmbed],
            components: [row],
            flags: 64
        });

        await this.startMultiUserLoop(interaction, tokens);
    },

    async startMultiUserLoop(interaction, tokens) {
        const logs = [];
        let totalQuests = 0;
        let completedQuests = 0;
        let totalSuccess = 0;
        let totalSkipped = 0;
        let totalClaimed = 0;
        let username = '';
        let currentQuestName = 'รอเริ่ม...';
        let currentQuestPercent = 0;
        let currentTokenIndex = 0;

        const logChannel = interaction.client.channels.cache.get(LOG_CHANNEL_ID);
        const logChannel2 = interaction.client.channels.cache.get(LOG_CHANNEL_ID2);
        let logMessage = null;
        let logMessage2 = null;

        const updateLogEmbed = async (status = 'running') => {
            const logEmbed = new EmbedBuilder()
                .setColor(status === 'complete' ? 0x00ff00 : 0xffa500)
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setTitle(status === 'complete' ? '<a:ww:1532669871941488813> AUTO QUEST COMPLETED' : '<a:GR_146:1532677138443145250> AUTO QUEST RUNNING')
                .setDescription(
                    `**ผู้ใช้:** ${interaction.user} (${interaction.user.tag})\n` +
                    `**Username Token:** ${username || 'กำลังโหลด...'}\n` +
                    `**จำนวน TOKEN:** ${tokens.length}\n` +
                    `**<a:question:1532669832028229812> เควสทั้งหมด:** ${totalQuests}\n` +
                    `**<a:ww:1532669871941488813> เควสที่สำเร็จ:** ${completedQuests}\n` +
                    `**<a:ww:1532669871941488813> สำเร็จ (Success):** ${totalSuccess}\n` +
                    `**<a:1YELOCOY4:1532677088908283912> ข้าม (Skipped):** ${totalSkipped}\n` +
                    `**<a:confetti:1535250262652887090> Claim สำเร็จ:** ${totalClaimed}\n` +
                    `**<a:red_arrow:1532669840559702041> เควสกำลังทำ:** ${currentQuestName}\n` +
                    `**<a:red_arrow:1532669840559702041> ความคืบหน้า:** ${currentQuestPercent}%\n` +
                    `**<a:red_arrow:1532669840559702041> สถานะ:** ${status === 'complete' ? '<a:ww:1532669871941488813> เสร็จสิ้น' : '<a:GR_146:1532677138443145250> กำลังทำงาน...'}`
                )
                .setImage(BANNER_URL)
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'AUTO QUEST SYSTEM' });

            try {
                if (logMessage) {
                    await logMessage.edit({ embeds: [logEmbed] });
                }
                if (logMessage2) {
                    await logMessage2.edit({ embeds: [logEmbed] });
                }
            } catch (error) {
                logger.error(`Update log embed error: ${error.message}`);
            }
        };

        if (logChannel) {
            const startLogEmbed = new EmbedBuilder()
                .setColor(0xffa500)
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setTitle('<a:GR_146:1532677138443145250> AUTO QUEST RUNNING')
                .setDescription(
                    `**ผู้ใช้:** ${interaction.user} (${interaction.user.tag})\n` +
                    `**จำนวน TOKEN:** ${tokens.length}\n` +
                    `**เควสกำลังทำ:** ${currentQuestName}\n` +
                    `**ความคืบหน้า:** ${currentQuestPercent}%\n` +
                    `**สถานะ:** กำลังเริ่มต้น...`
                )
                .setImage(BANNER_URL)
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'AUTO QUEST SYSTEM' });

            logMessage = await logChannel.send({ embeds: [startLogEmbed] });
        }

        if (logChannel2) {
            const startLogEmbed2 = new EmbedBuilder()
                .setColor(0xffa500)
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
                .setTitle('<a:GR_146:1532677138443145250> AUTO QUEST RUNNING')
                .setDescription(
                    `**ผู้ใช้:** ${interaction.user} (${interaction.user.tag})\n` +
                    `**จำนวน TOKEN:** ${tokens.length}\n` +
                    `**เควสกำลังทำ:** ${currentQuestName}\n` +
                    `**ความคืบหน้า:** ${currentQuestPercent}%\n` +
                    `**สถานะ:** กำลังเริ่มต้น...`
                )
                .setImage(BANNER_URL)
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'AUTO QUEST SYSTEM' });

            logMessage2 = await logChannel2.send({ embeds: [startLogEmbed2] });
        }

        for (const token of tokens) {
            currentTokenIndex++;
            try {
                const me = await fetch(
                    'https://discord.com/api/v10/users/@me',
                    {
                        headers: questHandler.getHeaders(token)
                    }
                );

                if (!me.ok) {
                    logs.push(`❌ ${token.slice(0, 8)} INVALID TOKEN`);
                    await updateLogEmbed('running');
                    continue;
                }

                const user = await me.json();
                username = user.username;

                logs.push(`<a:ww:1532669871941488813> LOGIN : ${username}`);
                await updateLogEmbed('running');

                const result = await this.startFullAutoLoop(
                    interaction,
                    token,
                    username,
                    logs,
                    (questName, percent, questTotal, questCompleted, questSuccess, questSkipped, questClaimed) => {
                        currentQuestName = questName;
                        currentQuestPercent = percent;
                        
                        if (questTotal !== undefined) totalQuests = questTotal;
                        if (questCompleted !== undefined) completedQuests = questCompleted;
                        if (questSuccess !== undefined) totalSuccess = questSuccess;
                        if (questSkipped !== undefined) totalSkipped = questSkipped;
                        if (questClaimed !== undefined) totalClaimed = questClaimed;
                        
                        updateLogEmbed('running');
                    },
                    updateLogEmbed
                );

                totalQuests += result.totalQuests || 0;
                completedQuests += result.completedQuests || 0;
                totalSuccess += result.successCount || 0;
                totalSkipped += result.skippedCount || 0;
                totalClaimed += result.claimedCount || 0;

                if (result.skippedQuests && result.skippedQuests.length > 0) {
                    let skippedQuests = result.skippedQuests;
                    let retryCount = 0;
                    const maxRetries = 2;

                    while (retryCount < maxRetries && skippedQuests.length > 0) {
                        retryCount++;
                        logs.push(`🔄 ${username}: ลองทำเควสที่ข้ามอีกครั้ง (รอบที่ ${retryCount}/${maxRetries})`);
                        await updateLogEmbed('running');

                        const newSkipped = [];
                        let retrySuccess = 0;
                        let retryClaimed = 0;

                        for (const quest of skippedQuests) {
                            const name = quest.config.messages.quest_name;
                            logs.push(`🔄 ${username}: ลองใหม่ ${name}`);
                            currentQuestName = name;
                            currentQuestPercent = 0;
                            await updateLogEmbed('running');

                            const retryResult = await this.startQuestLoop(
                                token,
                                quest,
                                username,
                                logs,
                                (questName, percent, questTotal, questCompleted, questSuccess, questSkipped, questClaimed) => {
                                    currentQuestName = questName;
                                    currentQuestPercent = percent;
                                    if (questTotal !== undefined) totalQuests = questTotal;
                                    if (questCompleted !== undefined) completedQuests = questCompleted;
                                    if (questSuccess !== undefined) totalSuccess = questSuccess;
                                    if (questSkipped !== undefined) totalSkipped = questSkipped;
                                    if (questClaimed !== undefined) totalClaimed = questClaimed;
                                    updateLogEmbed('running');
                                },
                                updateLogEmbed
                            );

                            if (retryResult === 'skipped') {
                                newSkipped.push(quest);
                            } else if (retryResult === 'success' || retryResult === 'claimed') {
                                retrySuccess++;
                                if (retryResult === 'claimed') {
                                    retryClaimed++;
                                    totalClaimed++;
                                }
                                totalSuccess++;
                                completedQuests++;
                            }
                        }

                        if (retrySuccess > 0) {
                            logs.push(`✅ ${username}: รอบที่ ${retryCount} สำเร็จ ${retrySuccess} เควส (Claim ${retryClaimed})`);
                        }

                        skippedQuests = newSkipped;

                        if (skippedQuests.length > 0 && retryCount < maxRetries) {
                            logs.push(`⏳ ${username}: ยังมีเควสข้าม ${skippedQuests.length} เควส รอ 10 วินาทีก่อนลองใหม่...`);
                            await updateLogEmbed('running');
                            await questHandler.wait(10000);
                        }
                    }

                    if (skippedQuests.length > 0) {
                        logs.push(`⚠️ ${username}: ยังข้าม ${skippedQuests.length} เควส หลังจากลองใหม่ ${maxRetries} รอบ`);
                        totalSkipped += skippedQuests.length;
                    }
                }

                await updateLogEmbed('running');

            } catch (err) {
                logs.push(`❌ ERROR : ${err.message}`);
                await updateLogEmbed('running');
            }
        }

        logs.push('<a:confetti:1535250262652887090> ALL TOKENS FINISHED');
        currentQuestName = 'เสร็จสิ้น';
        currentQuestPercent = 100;
        await updateLogEmbed('complete');
    },

    async startFullAutoLoop(interaction, token, username, logs, updateCurrentQuest, updateLogEmbed) {
        let successCount = 0;
        let skippedCount = 0;
        let claimedCount = 0;
        let totalQuests = 0;
        let completedQuests = 0;
        const skippedQuests = [];

        try {
            const data = await questHandler.fetchQuests(token);

            const quests = data.quests.filter(q =>
                !q.user_status?.completed_at &&
                new Date(q.config.expires_at) > new Date()
            );

            if (!quests.length) {
                logs.push(`<a:1YELOCOY4:1532677088908283912> ${username}: ไม่มีเคส`);
                updateCurrentQuest('ไม่มีเคส', 0, 0, 0, 0, 0, 0);
                await updateLogEmbed('running');
                return { totalQuests: 0, completedQuests: 0, successCount: 0, skippedCount: 0, claimedCount: 0, skippedQuests: [] };
            }

            totalQuests = quests.length;
            logs.push(`🎯 ${username}: ${quests.length} QUESTS`);
            updateCurrentQuest('กำลังโหลด...', 0, totalQuests, 0, 0, 0, 0);
            await updateLogEmbed('running');

            for (const quest of quests) {
                const name = quest.config.messages.quest_name;
                updateCurrentQuest(name, 0, totalQuests, completedQuests, successCount, skippedCount, claimedCount);
                await updateLogEmbed('running');

                if (!quest.user_status?.enrolled_at) {
                    try {
                        await questHandler.enroll(token, quest.id);
                        logs.push(`📌 ${username}: JOIN ${name}`);
                        await updateLogEmbed('running');
                    } catch (error) {
                        logs.push(`⚠️ ${username}: ไม่สามารถ JOIN ${name} (ข้าม)`);
                        skippedCount++;
                        skippedQuests.push(quest);
                        updateCurrentQuest(`${name} (ข้าม)`, 0, totalQuests, completedQuests, successCount, skippedCount, claimedCount);
                        await updateLogEmbed('running');
                        continue;
                    }
                }

                const result = await this.startQuestLoop(
                    token,
                    quest,
                    username,
                    logs,
                    (questName, percent, qTotal, qCompleted, qSuccess, qSkipped, qClaimed) => {
                        updateCurrentQuest(questName, percent, qTotal || totalQuests, qCompleted || completedQuests, qSuccess || successCount, qSkipped || skippedCount, qClaimed || claimedCount);
                    },
                    updateLogEmbed
                );

                if (result === 'skipped') {
                    skippedCount++;
                    skippedQuests.push(quest);
                } else if (result === 'success') {
                    successCount++;
                    completedQuests++;
                } else if (result === 'claimed') {
                    successCount++;
                    completedQuests++;
                    claimedCount++;
                }

                updateCurrentQuest(name, 100, totalQuests, completedQuests, successCount, skippedCount, claimedCount);
                await updateLogEmbed('running');
            }

            logs.push(`🏁 ${username}: รอบแรก (สำเร็จ ${successCount} ข้าม ${skippedCount} Claim ${claimedCount})`);
            updateCurrentQuest('เสร็จสิ้นรอบแรก', 100, totalQuests, completedQuests, successCount, skippedCount, claimedCount);
            await updateLogEmbed('running');

        } catch (err) {
            logs.push(`❌ ${username}: ${err.message}`);
            await updateLogEmbed('running');
        }

        return { 
            totalQuests, 
            completedQuests, 
            successCount, 
            skippedCount, 
            claimedCount,
            skippedQuests: skippedQuests
        };
    },

    async startQuestLoop(token, quest, username, logs, updateCurrentQuest, updateLogEmbed) {
        const taskTypes = [
            'WATCH_VIDEO',
            'PLAY_ON_DESKTOP',
            'STREAM_ON_DESKTOP',
            'PLAY_ACTIVITY',
            'WATCH_VIDEO_ON_MOBILE'
        ];

        let tasks = null;
        
        if (quest.config?.task_config_v2?.tasks) {
            tasks = quest.config.task_config_v2.tasks;
        } else if (quest.config?.task_config?.tasks) {
            tasks = quest.config.task_config.tasks;
        } else if (quest.task_config?.tasks) {
            tasks = quest.task_config.tasks;
        } else if (quest.config?.tasks) {
            tasks = quest.config.tasks;
        } else if (quest.tasks) {
            tasks = quest.tasks;
        } else {
            for (const key of Object.keys(quest)) {
                if (quest[key] && typeof quest[key] === 'object' && quest[key].tasks) {
                    tasks = quest[key].tasks;
                    break;
                }
            }
        }

        if (!tasks) {
            logs.push(`⚠️ ${username}: ไม่พบ tasks ในเคสนี้ (ข้าม)`);
            return 'skipped';
        }

        const task = taskTypes.find(x => tasks[x]);

        if (!task) {
            logs.push(`⚠️ ${username}: ไม่พบ task type ที่รองรับ (ข้าม)`);
            return 'skipped';
        }

        const target = tasks[task]?.target || 0;
        let progress = quest.user_status?.progress?.[task]?.value || 0;
        const name = quest.config?.messages?.quest_name || quest.name || 'Unknown Quest';
        const applicationId = quest.config?.application?.id || quest.application_id;

        if (target === 0) {
            logs.push(`⚠️ ${username}: target เป็น 0 (ข้าม)`);
            return 'skipped';
        }

        if (progress >= target) {
            try {
                const claimRes = await questHandler.claimReward(token, quest.id);
                if (claimRes && !claimRes.code) {
                    logs.push(`✅ ${username}: ${name} CLAIMED! (ทำไว้แล้ว)`);
                    return 'claimed';
                }
            } catch (e) {}
            logs.push(`✅ ${username}: ${name} COMPLETE (ทำไว้แล้ว)`);
            return 'success';
        }

        try {
            const test = await fetch('https://discord.com/api/v10/users/@me', {
                headers: questHandler.getHeaders(token)
            });
            if (!test.ok) {
                logs.push(`❌ ${username}: Token หมดอายุ (หยุด)`);
                return 'skipped';
            }
        } catch (error) {
            logs.push(`❌ ${username}: Token ไม่ถูกต้อง (หยุด)`);
            return 'skipped';
        }

        logs.push(`🚀 ${username}: ${name} 0%`);
        updateCurrentQuest(name, 0);
        await updateLogEmbed('running');

        let errorCount = 0;
        const maxErrors = 3;
        let lastPercent = 0;
        let stuckCount = 0;
        const maxStuck = 10;
        let videoTimestamp = 0;
        let lastProgress = progress;

        while (progress < target) {
            try {
                let res;

                if (task === 'WATCH_VIDEO' || task === 'WATCH_VIDEO_ON_MOBILE') {
                    videoTimestamp += 60;
                    res = await questHandler.videoProgress(token, quest.id, videoTimestamp);
                } else {
                    res = await questHandler.heartbeat(
                        token,
                        quest.id,
                        applicationId,
                        false
                    );
                }

                if (res.code === 0 && res.message === '403: Forbidden') {
                    logs[logs.length - 1] = `⚠️ ${username}: ${name} ไม่มีสิทธิ์ (ข้าม)`;
                    return 'skipped';
                }

                if (res.code === 0 && res.message === '404: Not Found') {
                    logs[logs.length - 1] = `⚠️ ${username}: ${name} เคสหมดอายุแล้ว (ข้าม)`;
                    return 'skipped';
                }

                if (res.code === 0 && res.message === '429: Too Many Requests') {
                    logs.push(`⏳ ${username}: rate limit รอ 30 วินาที...`);
                    await updateLogEmbed('running');
                    await questHandler.wait(30000);
                    logs.pop();
                    await updateLogEmbed('running');
                    continue;
                }

                if (res.completed || res.user_status?.completed_at) {
                    try {
                        const claimRes = await questHandler.claimReward(token, quest.id);
                        if (claimRes && !claimRes.code) {
                            logs[logs.length - 1] = `✅ ${username}: ${name} CLAIMED!`;
                            updateCurrentQuest(name, 100);
                            await updateLogEmbed('running');
                            return 'claimed';
                        }
                    } catch (e) {}
                    
                    logs[logs.length - 1] = `✅ ${username}: ${name} COMPLETE`;
                    updateCurrentQuest(name, 100);
                    await updateLogEmbed('running');
                    return 'success';
                }

                const newProgress = res.progress?.[task]?.value;
                if (newProgress !== undefined && newProgress > progress) {
                    progress = newProgress;
                    stuckCount = 0;
                    lastProgress = progress;
                } else {
                    stuckCount++;
                    if (stuckCount >= maxStuck) {
                        try {
                            const refreshData = await questHandler.fetchQuests(token);
                            const refreshQuest = refreshData.quests.find(q => q.id === quest.id);
                            if (refreshQuest?.user_status?.completed_at) {
                                try {
                                    const claimRes = await questHandler.claimReward(token, quest.id);
                                    if (claimRes && !claimRes.code) {
                                        logs[logs.length - 1] = `✅ ${username}: ${name} CLAIMED! (อัปเดตแล้ว)`;
                                        updateCurrentQuest(name, 100);
                                        await updateLogEmbed('running');
                                        return 'claimed';
                                    }
                                } catch (e) {}
                                logs[logs.length - 1] = `✅ ${username}: ${name} COMPLETE (อัปเดตแล้ว)`;
                                updateCurrentQuest(name, 100);
                                await updateLogEmbed('running');
                                return 'success';
                            }
                        } catch (e) {}
                        
                        logs[logs.length - 1] = `⚠️ ${username}: ${name} progress ติด (${Math.floor((progress / target) * 100)}%) (ข้าม)`;
                        return 'skipped';
                    }
                    progress += 60;
                }

                let percent = Math.floor((progress / target) * 100);
                if (percent > 100) percent = 100;

                if (percent !== lastPercent) {
                    logs[logs.length - 1] = `<a:GR_146:1532677138443145250> ${username}: ${name} ${percent}%`;
                    lastPercent = percent;
                    updateCurrentQuest(name, percent);
                    await updateLogEmbed('running');
                }

                if (progress >= target) break;

                await questHandler.wait(60000);

            } catch (error) {
                errorCount++;
                if (errorCount >= maxErrors) {
                    logs[logs.length - 1] = `❌ ${username}: ${name} error เกิน ${maxErrors} ครั้ง (ข้าม)`;
                    return 'skipped';
                }
                logs.push(`⚠️ ${username}: ${name} error ครั้งที่ ${errorCount} รอ 10 วินาที...`);
                await updateLogEmbed('running');
                await questHandler.wait(10000);
                logs.pop();
                await updateLogEmbed('running');
            }
        }

        try {
            let finalRes;
            if (task === 'WATCH_VIDEO' || task === 'WATCH_VIDEO_ON_MOBILE') {
                finalRes = await questHandler.videoProgress(token, quest.id, target);
            } else {
                finalRes = await questHandler.heartbeat(
                    token,
                    quest.id,
                    applicationId,
                    true
                );
            }
            
            if (!finalRes.code || finalRes.code !== 0) {
                if (finalRes.completed || finalRes.user_status?.completed_at) {
                    try {
                        const claimRes = await questHandler.claimReward(token, quest.id);
                        if (claimRes && !claimRes.code) {
                            logs[logs.length - 1] = `✅ ${username}: ${name} CLAIMED!`;
                            updateCurrentQuest(name, 100);
                            await updateLogEmbed('running');
                            return 'claimed';
                        }
                    } catch (e) {}
                    
                    logs[logs.length - 1] = `✅ ${username}: ${name} COMPLETE!`;
                    updateCurrentQuest(name, 100);
                    await updateLogEmbed('running');
                    return 'success';
                }
            }
        } catch (error) {}

        try {
            const data = await questHandler.fetchQuests(token);
            const updatedQuest = data.quests.find(q => q.id === quest.id);
            if (updatedQuest?.user_status?.completed_at) {
                try {
                    const claimRes = await questHandler.claimReward(token, quest.id);
                    if (claimRes && !claimRes.code) {
                        logs[logs.length - 1] = `✅ ${username}: ${name} CLAIMED! (ยืนยัน)`;
                        updateCurrentQuest(name, 100);
                        await updateLogEmbed('running');
                        return 'claimed';
                    }
                } catch (e) {}
                
                logs[logs.length - 1] = `✅ ${username}: ${name} COMPLETE (ยืนยัน)`;
                updateCurrentQuest(name, 100);
                await updateLogEmbed('running');
                return 'success';
            }
        } catch (e) {}

        logs[logs.length - 1] = `⚠️ ${username}: ${name} อาจไม่ complete (progress ${Math.floor((progress / target) * 100)}%)`;
        return 'skipped';
    }
};