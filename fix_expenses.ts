
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const logId = "3eadc23d-f96b-45fb-b4bc-afd6b7e634c1";

    const log = await prisma.maintenanceLog.findUnique({
        where: { id: logId },
        include: { parts: true }
    });

    if (!log) {
        console.log("Log not found");
        return;
    }

    console.log(`Fixing expenses for Log: ${log.id}`);

    for (const part of log.parts) {
        // Find unlinked expense that matches this part
        // We can't easily match by name because part.name isn't here, only part.sparePartId.
        // But we can match by price/quantity? 
        // SAFEST: Just finding unlinked expenses in this WO and linking them since we know the context.

        // Let's get the part details to match description
        const sparePart = await prisma.sparePart.findUnique({
            where: { id: part.sparePartId }
        });

        if (!sparePart) continue;

        const updated = await prisma.expense.updateMany({
            where: {
                workOrderId: log.workOrderId,
                maintenanceLogId: null,
                // Match description vaguely or by amount
                OR: [
                    { description: { contains: sparePart.code } },
                    { description: { contains: sparePart.name } },
                    { total: part.totalPrice }
                ]
            },
            data: {
                maintenanceLogId: log.id
            }
        });
        console.log(`Linked ${updated.count} expenses for part ${sparePart.code}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
