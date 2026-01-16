
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const logId = "3eadc23d-f96b-45fb-b4bc-afd6b7e634c1"; // From debug output

    const log = await prisma.maintenanceLog.findUnique({
        where: { id: logId },
        include: { workOrder: true }
    });

    if (!log) {
        console.log("Log not found");
        return;
    }

    console.log(`Fixing parts for Log: ${log.description} (WO: ${log.workOrder.woNumber})`);

    const updated = await prisma.workOrderPart.updateMany({
        where: {
            workOrderId: log.workOrderId,
            maintenanceLogId: null
        },
        data: {
            maintenanceLogId: log.id
        }
    });

    console.log(`Updated ${updated.count} orphaned parts to link to Log ID ${log.id}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
