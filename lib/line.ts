/**
 * LINE Messaging API Client Configuration
 * สำหรับส่งข้อความแจ้งเตือนผ่าน LINE
 */

import { messagingApi } from '@line/bot-sdk';

// LINE configuration from environment variables
const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

// Create LINE Messaging API client
export const lineClient = new messagingApi.MessagingApiClient({
    channelAccessToken: config.channelAccessToken,
});

// Export config for webhook validation
export { config as lineConfig };

// Check if LINE is properly configured
export function isLineConfigured(): boolean {
    return Boolean(config.channelAccessToken && config.channelSecret);
}
