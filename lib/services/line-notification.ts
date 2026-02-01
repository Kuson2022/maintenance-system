/**
 * LINE Group Notification Service
 * ส่งแจ้งเตือนเข้ากลุ่ม LINE พร้อม @mention ช่างผู้รับผิดชอบ
 */

import { lineClient, isLineConfigured } from '@/lib/line';
import { TextMessage } from '@line/bot-sdk';

// ========================================
// TYPES
// ========================================

export type LineNotificationType =
    | 'WORK_ORDER_CREATED'
    | 'WORK_ORDER_ASSIGNED'
    | 'WORK_ORDER_STATUS_CHANGED'
    | 'PM_DUE';

export interface GroupNotificationPayload {
    type: LineNotificationType;
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
        lineUserId?: string | null;
        lineDisplayName?: string | null;
    };
}

// ========================================
// MAIN FUNCTIONS
// ========================================

/**
 * ส่งข้อความแจ้งเตือนเข้ากลุ่ม LINE
 */
export async function sendGroupNotification(payload: GroupNotificationPayload): Promise<void> {
    try {
        // ตรวจสอบว่า LINE ถูก configure หรือยัง
        if (!isLineConfigured()) {
            console.warn('LINE is not configured - skipping notification');
            return;
        }

        // ดึง Group ID จาก environment variable
        const groupId = process.env.LINE_GROUP_ID;

        if (!groupId) {
            console.warn('LINE_GROUP_ID is not configured - skipping notification');
            return;
        }

        const message = createGroupMessage(payload);

        await lineClient.pushMessage({
            to: groupId,
            messages: [message],
        });

        console.log(`LINE notification sent: ${payload.type}`);
    } catch (error) {
        console.error('Error sending LINE notification:', error);
        // Don't throw - notification failures shouldn't break the main flow
    }
}

// ========================================
// MESSAGE TEMPLATES
// ========================================

/**
 * สร้างข้อความพร้อม @mention
 */
function createGroupMessage(payload: GroupNotificationPayload): TextMessage {
    const { workOrder, technician } = payload;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com';

    // === แจ้งเตือนงานใหม่ที่ยังไม่ได้มอบหมาย ===
    if (payload.type === 'WORK_ORDER_CREATED' && workOrder) {
        const workOrderUrl = `${appUrl}/dashboard/work-orders/${workOrder.id}`;

        const messageText = [
            `📣 มีงานแจ้งซ่อมใหม่!`,
            ``,
            `📝 เรื่อง: ${workOrder.title}`,
            `📦 อุปกรณ์: ${workOrder.equipment.name}`,
            `⚡ ความเร่งด่วน: ${getPriorityLabel(workOrder.priority)}`,
            `📋 เลขที่: ${workOrder.woNumber}`,
            workOrder.reporter ? `👤 ผู้แจ้ง: ${workOrder.reporter.name}` : '',
            ``,
            `⏳ รอมอบหมายช่างผู้รับผิดชอบ`,
            ``,
            `🔗 ดูรายละเอียด: ${workOrderUrl}`,
        ].filter(Boolean).join('\n');

        return { type: 'text', text: messageText };
    }

    // === แจ้งเตือนงานที่มอบหมายแล้ว พร้อม @mention ช่าง ===
    if (payload.type === 'WORK_ORDER_ASSIGNED' && workOrder && technician) {
        // สร้าง mention tag สำหรับช่าง
        // รูปแบบ: <m userId="{lineUserId}"> จะแสดงเป็น @ชื่อ (highlight สีฟ้า)
        const mentionTag = technician.lineUserId
            ? `<m userId="${technician.lineUserId}">`
            : technician.lineDisplayName
                ? `@${technician.lineDisplayName}`
                : '';

        // แสดงทั้งชื่อจริง + @mention
        // ตัวอย่าง: "ช่างสุเทพ @ช่างเทพ"
        const technicianDisplay = mentionTag
            ? `${technician.name} ${mentionTag}`
            : technician.name;

        const workOrderUrl = `${appUrl}/dashboard/work-orders/${workOrder.id}`;

        const messageText = [
            `🔧 มอบหมายงานซ่อม`,
            ``,
            `📝 เรื่อง: ${workOrder.title}`,
            `👷 ช่างผู้รับผิดชอบ: ${technicianDisplay.trim()}`,
            `📦 อุปกรณ์: ${workOrder.equipment.name}`,
            `⚡ ความเร่งด่วน: ${getPriorityLabel(workOrder.priority)}`,
            `📋 เลขที่: ${workOrder.woNumber}`,
            ``,
            `🔗 ดูรายละเอียด: ${workOrderUrl}`,
        ].join('\n');

        return { type: 'text', text: messageText };
    }

    // === แจ้งเตือนสถานะเปลี่ยน ===
    if (payload.type === 'WORK_ORDER_STATUS_CHANGED' && workOrder) {
        const workOrderUrl = `${appUrl}/dashboard/work-orders/${workOrder.id}`;

        return {
            type: 'text',
            text: `📋 สถานะงาน ${workOrder.woNumber} มีการอัพเดท\n\n🔗 ดูรายละเอียด: ${workOrderUrl}`,
        };
    }

    // Default message
    return {
        type: 'text',
        text: '📢 มีการอัพเดทในระบบซ่อมบำรุง',
    };
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
