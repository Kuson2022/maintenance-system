/**
 * Telegram Bot API Client
 * ใช้ HTTP requests โดยตรง ไม่ต้องติดตั้ง dependencies เพิ่ม
 */

const TELEGRAM_API = 'https://api.telegram.org/bot';

/**
 * ส่งข้อความผ่าน Telegram Bot API
 */
export async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
        console.warn('Telegram bot token not configured - skipping');
        return;
    }

    try {
        const response = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'HTML',
                disable_web_page_preview: false,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Telegram API error:', error);
        }
    } catch (error) {
        console.error('Error sending Telegram message:', error);
    }
}

/**
 * ตรวจสอบว่า Telegram ถูก configure หรือยัง
 */
export function isTelegramConfigured(): boolean {
    return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

/**
 * ดึง Chat ID จาก environment
 */
export function getTelegramChatId(): string | undefined {
    return process.env.TELEGRAM_CHAT_ID;
}
