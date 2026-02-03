/**
 * Telegram Group Notification Service
 * ส่งแจ้งเตือนเข้ากลุ่ม Telegram ในรูปแบบเดียวกับ LINE
 */

import { sendTelegramMessage, isTelegramConfigured, getTelegramChatId } from '@/lib/telegram';

// ========================================
// TYPES
// ========================================

export type TelegramNotificationType =
    | 'WORK_ORDER_CREATED'
    | 'WORK_ORDER_ASSIGNED'
    | 'WORK_ORDER_STATUS_CHANGED'
    | 'PM_DUE'
    | 'PM_OVERDUE';

export interface TelegramNotificationPayload {
    type: TelegramNotificationType;
    workOrder?: {
        id: string;
        woNumber: string;
        title: string;
        priority: string;
        equipment: { name: string };
        reporter?: { name: string };
    };
    technician?: {
        id: string;
        name: string;
        telegramUsername?: string | null;  // เช่น "@changthep"
    };
    pmSchedule?: {
        id: string;
        activityName: string;
        nextDueDate: Date;
        equipment: { name: string; code: string; location?: string | null };
        daysOverdue?: number;
    };
}

// ========================================
// MAIN FUNCTIONS
// ========================================

/**
 * ส่งข้อความแจ้งเตือนเข้ากลุ่ม Telegram
 */
export async function sendTelegramGroupNotification(payload: TelegramNotificationPayload): Promise<void> {
    try {
        if (!isTelegramConfigured()) {
            console.warn('Telegram is not configured - skipping notification');
            return;
        }

        const chatId = getTelegramChatId();
        if (!chatId) return;

        const message = createTelegramMessage(payload);
        await sendTelegramMessage(chatId, message);

        console.log(`Telegram notification sent: ${payload.type}`);
    } catch (error) {
        console.error('Error sending Telegram notification:', error);
        // Don't throw - notification failures shouldn't break the main flow
    }
}

// ========================================
// MESSAGE TEMPLATES
// ========================================

/**
 * สร้างข้อความ Telegram พร้อม HTML formatting
 */
function createTelegramMessage(payload: TelegramNotificationPayload): string {
    const { workOrder, technician } = payload;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com';

    // === แจ้งเตือนงานใหม่ที่ยังไม่ได้มอบหมาย ===
    if (payload.type === 'WORK_ORDER_CREATED' && workOrder) {
        const workOrderUrl = `${appUrl}/dashboard/work-orders/${workOrder.id}`;

        return [
            `📣 <b>มีงานแจ้งซ่อมใหม่!</b>`,
            ``,
            `📝 เรื่อง: ${escapeHtml(workOrder.title)}`,
            `📦 อุปกรณ์: ${escapeHtml(workOrder.equipment.name)}`,
            `⚡ ความเร่งด่วน: ${getPriorityLabel(workOrder.priority)}`,
            `📋 เลขที่: ${workOrder.woNumber}`,
            workOrder.reporter ? `👤 ผู้แจ้ง: ${escapeHtml(workOrder.reporter.name)}` : '',
            ``,
            `⏳ รอมอบหมายช่างผู้รับผิดชอบ`,
            ``,
            `🔗 ดูรายละเอียด: ${workOrderUrl}`,
        ].filter(Boolean).join('\n');
    }

    // === แจ้งเตือนงานที่มอบหมายแล้ว ===
    if (payload.type === 'WORK_ORDER_ASSIGNED' && workOrder && technician) {
        const workOrderUrl = `${appUrl}/dashboard/work-orders/${workOrder.id}`;

        // @mention ใน Telegram ใช้ @username ได้เลย
        const technicianDisplay = technician.telegramUsername
            ? `${escapeHtml(technician.name)} ${technician.telegramUsername}`
            : escapeHtml(technician.name);

        return [
            `🔧 <b>มอบหมายงานซ่อม</b>`,
            ``,
            `📝 เรื่อง: ${escapeHtml(workOrder.title)}`,
            `👷 ช่างผู้รับผิดชอบ: ${technicianDisplay}`,
            `📦 อุปกรณ์: ${escapeHtml(workOrder.equipment.name)}`,
            `⚡ ความเร่งด่วน: ${getPriorityLabel(workOrder.priority)}`,
            `📋 เลขที่: ${workOrder.woNumber}`,
            ``,
            `🔗 ดูรายละเอียด: ${workOrderUrl}`,
        ].join('\n');
    }

    // === แจ้งเตือนสถานะเปลี่ยน ===
    if (payload.type === 'WORK_ORDER_STATUS_CHANGED' && workOrder) {
        const workOrderUrl = `${appUrl}/dashboard/work-orders/${workOrder.id}`;

        return [
            `📋 สถานะงาน ${workOrder.woNumber} มีการอัพเดท`,
            ``,
            `🔗 ดูรายละเอียด: ${workOrderUrl}`,
        ].join('\n');
    }

    // === แจ้งเตือน PM Due (ก่อนถึงกำหนด) ===
    if (payload.type === 'PM_DUE' && payload.pmSchedule) {
        const { pmSchedule } = payload;
        const dueDateStr = pmSchedule.nextDueDate.toLocaleDateString('th-TH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const technicianDisplay = technician?.telegramUsername
            ? `${escapeHtml(technician.name)} ${technician.telegramUsername}`
            : technician ? escapeHtml(technician.name) : 'ยังไม่ได้มอบหมาย';

        return [
            `🔔 <b>แจ้งเตือน PM ใกล้ถึงกำหนด</b>`,
            ``,
            `📝 งาน: ${escapeHtml(pmSchedule.activityName)}`,
            `📦 อุปกรณ์: ${escapeHtml(pmSchedule.equipment.name)} (${pmSchedule.equipment.code})`,
            pmSchedule.equipment.location ? `📍 สถานที่: ${escapeHtml(pmSchedule.equipment.location)}` : '',
            `📅 วันที่กำหนด: ${dueDateStr}`,
            `👷 ผู้รับผิดชอบ: ${technicianDisplay}`,
            ``,
            `🔗 ดูรายละเอียด: ${appUrl}/dashboard/maintenance-schedule`,
        ].filter(Boolean).join('\n');
    }

    // === แจ้งเตือน PM Overdue (เกินกำหนด) ===
    if (payload.type === 'PM_OVERDUE' && payload.pmSchedule) {
        const { pmSchedule } = payload;
        const dueDateStr = pmSchedule.nextDueDate.toLocaleDateString('th-TH', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const technicianDisplay = technician?.telegramUsername
            ? `${escapeHtml(technician.name)} ${technician.telegramUsername}`
            : technician ? escapeHtml(technician.name) : 'ยังไม่ได้มอบหมาย';

        return [
            `⚠️ <b>แจ้งเตือน PM เกินกำหนด!</b>`,
            ``,
            `📝 งาน: ${escapeHtml(pmSchedule.activityName)}`,
            `📦 อุปกรณ์: ${escapeHtml(pmSchedule.equipment.name)} (${pmSchedule.equipment.code})`,
            pmSchedule.equipment.location ? `📍 สถานที่: ${escapeHtml(pmSchedule.equipment.location)}` : '',
            `📅 วันที่กำหนด: ${dueDateStr}`,
            `❗ เกินกำหนด: ${pmSchedule.daysOverdue || 0} วัน`,
            `👷 ผู้รับผิดชอบ: ${technicianDisplay}`,
            ``,
            `กรุณาดำเนินการโดยเร็ว!`,
            `🔗 ดูรายละเอียด: ${appUrl}/dashboard/maintenance-schedule`,
        ].filter(Boolean).join('\n');
    }

    // Default message
    return '📢 มีการอัพเดทในระบบซ่อมบำรุง';
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * แปลง priority เป็นภาษาไทย พร้อม emoji
 */
function getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
        LOW: '🟢 ปกติ',
        MEDIUM: '🟡 ปานกลาง',
        HIGH: '🟠 ด่วน',
        CRITICAL: '🔴 ด่วนมาก',
    };
    return labels[priority] || priority;
}

/**
 * Escape HTML characters สำหรับ Telegram
 */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
