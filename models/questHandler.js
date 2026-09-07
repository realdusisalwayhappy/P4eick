// questHandler.js
const logger = require('../utlis/fuck_logger');
const crypto = require('crypto');

class QuestHandler {
    constructor() {
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9215 Chrome/138.0.7204.251 Electron/37.6.0 Safari/537.36';
        this.properties = {
            os: 'Windows',
            browser: 'Discord Client',
            release_channel: 'stable',
            client_version: '1.0.9215',
            os_version: '10.0.19045',
            os_arch: 'x64',
            app_arch: 'x64',
            system_locale: 'en-US',
            has_client_mods: false,
            client_launch_id: crypto.randomUUID(),
            browser_user_agent: this.userAgent,
            browser_version: '37.6.0',
            os_sdk_version: '19045',
            client_build_number: 471091,
            native_build_number: 72186,
            client_event_source: null,
            launch_signature: crypto.randomUUID(),
            client_heartbeat_session_id: crypto.randomUUID(),
            client_app_state: 'focused',
        };
        this.superProperties = Buffer.from(JSON.stringify(this.properties)).toString('base64');
    }

    getHeaders(token) {
        return {
            'Authorization': token.replace('Bot ', ''),
            'Content-Type': 'application/json',
            'User-Agent': this.userAgent,
            'Accept-Language': 'en-US',
            'Origin': 'https://discord.com',
            'Referer': 'https://discord.com/channels/@me',
            'X-Super-Properties': this.superProperties,
            'X-Discord-Locale': 'en-US',
            'X-Debug-Options': 'bugReporterEnabled'
        };
    }

    async fetchQuests(token) {
        try {
            const res = await fetch('https://discord.com/api/v10/quests/@me', {
                method: 'GET',
                headers: this.getHeaders(token)
            });
            const data = await res.json();
            return data;
        } catch (error) {
            logger.error(`[QuestAPI] Fetch Quests Error: ${error.message}`);
            throw error;
        }
    }

    async enroll(token, questId) {
        try {
            const res = await fetch(`https://discord.com/api/v10/quests/${questId}/enroll`, {
                method: 'POST',
                headers: this.getHeaders(token),
                body: JSON.stringify({
                    location: 11,
                    is_targeted: false,
                    metadata_raw: null,
                })
            });
            return await res.json();
        } catch (error) {
            logger.error(`[QuestAPI] Enroll Error: ${error.message}`);
            throw error;
        }
    }

    async heartbeat(token, questId, applicationId, terminal = false) {
        try {
            const res = await fetch(`https://discord.com/api/v10/quests/${questId}/heartbeat`, {
                method: 'POST',
                headers: this.getHeaders(token),
                body: JSON.stringify({
                    application_id: applicationId,
                    terminal: terminal,
                })
            });
            return await res.json();
        } catch (error) {
            logger.error(`[QuestAPI] Heartbeat Error: ${error.message}`);
            throw error;
        }
    }

    async videoProgress(token, questId, timestamp) {
        try {
            const res = await fetch(`https://discord.com/api/v10/quests/${questId}/video-progress`, {
                method: 'POST',
                headers: this.getHeaders(token),
                body: JSON.stringify({
                    timestamp: timestamp
                })
            });
            return await res.json();
        } catch (error) {
            logger.error(`[QuestAPI] Video Progress Error: ${error.message}`);
            throw error;
        }
    }

    async claimReward(token, questId) {
        try {
            const res = await fetch(`https://discord.com/api/v10/quests/${questId}/claim-reward`, {
                method: 'POST',
                headers: this.getHeaders(token),
                body: JSON.stringify({
                    location: 11
                })
            });
            return await res.json();
        } catch (error) {
            logger.error(`[QuestAPI] Claim Reward Error: ${error.message}`);
            throw error;
        }
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new QuestHandler();