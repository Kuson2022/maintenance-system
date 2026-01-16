/**
 * Migration Script: Update QR Codes for Existing Equipment
 * 
 * This script updates all existing equipment QR codes to the new URL format:
 * {NEXT_PUBLIC_APP_URL}/dashboard/equipment/{equipmentId}
 * 
 * Run with: npx ts-node scripts/migrate-qr-codes.ts
 * Or: npx tsx scripts/migrate-qr-codes.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateQrCodes() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    console.log("🔄 Starting QR Code migration...");
    console.log(`📍 Base URL: ${baseUrl}`);

    try {
        // Get all equipment
        const allEquipment = await prisma.equipment.findMany({
            select: {
                id: true,
                code: true,
                qrCode: true,
            },
        });

        console.log(`📦 Found ${allEquipment.length} equipment to update`);

        let updated = 0;
        let skipped = 0;

        for (const equipment of allEquipment) {
            const newQrCode = `${baseUrl}/dashboard/equipment/${equipment.id}`;

            // Check if already in new format
            if (equipment.qrCode === newQrCode) {
                skipped++;
                continue;
            }

            await prisma.equipment.update({
                where: { id: equipment.id },
                data: { qrCode: newQrCode },
            });

            console.log(`✅ Updated: ${equipment.code} -> ${newQrCode}`);
            updated++;
        }

        console.log("\n📊 Migration Summary:");
        console.log(`   ✅ Updated: ${updated}`);
        console.log(`   ⏭️  Skipped (already migrated): ${skipped}`);
        console.log("🎉 Migration completed successfully!");

    } catch (error) {
        console.error("❌ Migration failed:", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the migration
migrateQrCodes();
