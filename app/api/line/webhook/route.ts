/**
 * LINE Webhook Handler
 * รับ events จาก LINE Platform เช่น follow, message สำหรับ account linking
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSignature, WebhookEvent } from '@line/bot-sdk';
import { lineConfig, lineClient, isLineConfigured } from '@/lib/line';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        // ตรวจสอบว่า LINE ถูก configure หรือยัง
        if (!isLineConfigured()) {
            return NextResponse.json({ error: 'LINE not configured' }, { status: 500 });
        }

        const body = await req.text();
        const signature = req.headers.get('x-line-signature');

        // Validate signature
        if (!signature || !validateSignature(body, lineConfig.channelSecret, signature)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const { events } = JSON.parse(body) as { events: WebhookEvent[] };

        for (const event of events) {
            await handleEvent(event);
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('LINE webhook error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

/**
 * Handle individual LINE events
 */
async function handleEvent(event: WebhookEvent) {
    // Handle bot joining a group - save group ID
    if (event.type === 'join' && event.source.type === 'group') {
        await handleJoinGroup(event.source.groupId);
    }

    // Handle user following the bot
    if (event.type === 'follow' && event.source.type === 'user') {
        await handleFollow(event.source.userId);
    }

    // Handle text messages for account linking
    if (event.type === 'message' && event.message.type === 'text' && event.source.type === 'user') {
        await handleLinkingCode(event.source.userId, event.message.text, event.replyToken);
    }
}

/**
 * Handle bot joining a group - save the group ID
 */
async function handleJoinGroup(groupId: string) {
    try {
        // Get group summary if available
        let groupName: string | null = null;
        try {
            const summary = await lineClient.getGroupSummary(groupId);
            groupName = summary.groupName;
        } catch {
            // Group name not available
        }

        // Upsert LINE settings with group ID
        await prisma.lineSettings.upsert({
            where: { groupId },
            update: { groupName, isActive: true },
            create: { groupId, groupName, isActive: true },
        });

        console.log(`Bot joined group: ${groupId} (${groupName})`);
    } catch (error) {
        console.error('Error handling group join:', error);
    }
}

/**
 * Handle user following the bot - send welcome message
 */
async function handleFollow(lineUserId: string) {
    try {
        await lineClient.pushMessage({
            to: lineUserId,
            messages: [{
                type: 'text',
                text: [
                    'ยินดีต้อนรับสู่ระบบแจ้งเตือน Maintenance! 🔧',
                    '',
                    'เพื่อเชื่อมต่อบัญชี LINE กับระบบ:',
                    '1. เข้าไปที่หน้า Settings > Notifications ในระบบ',
                    '2. คัดลอก Linking Code',
                    '3. ส่ง Code มาให้ฉันที่นี่',
                    '',
                    'หากต้องการความช่วยเหลือ กรุณาติดต่อผู้ดูแลระบบ',
                ].join('\n'),
            }],
        });
    } catch (error) {
        console.error('Error handling follow:', error);
    }
}

/**
 * Handle linking code from user to connect LINE account
 */
async function handleLinkingCode(lineUserId: string, code: string, replyToken: string) {
    try {
        const trimmedCode = code.trim().toUpperCase();

        // Find user with matching linking code
        const user = await prisma.user.findFirst({
            where: { linkingCode: trimmedCode }
        });

        if (user) {
            // Get LINE profile for display name
            let lineDisplayName: string | null = null;
            try {
                const profile = await lineClient.getProfile(lineUserId);
                lineDisplayName = profile.displayName;
            } catch {
                // Profile not available
            }

            // Update user with LINE info
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    lineUserId,
                    lineDisplayName,
                    lineNotify: true,
                    linkingCode: null, // Clear the code after successful link
                },
            });

            // Send success message
            await lineClient.replyMessage({
                replyToken,
                messages: [{
                    type: 'text',
                    text: `✅ เชื่อมต่อสำเร็จ!\n\nบัญชี LINE ของคุณได้เชื่อมต่อกับ ${user.name} (${user.email}) เรียบร้อยแล้ว\n\nคุณจะได้รับแจ้งเตือนงานซ่อมบำรุงผ่าน LINE`,
                }],
            });
        } else {
            // No matching code found
            await lineClient.replyMessage({
                replyToken,
                messages: [{
                    type: 'text',
                    text: '❌ ไม่พบ Linking Code นี้ในระบบ\n\nกรุณาตรวจสอบ Code อีกครั้ง หรือสร้าง Code ใหม่จากหน้า Settings > Notifications',
                }],
            });
        }
    } catch (error) {
        console.error('Error handling linking code:', error);
    }
}
