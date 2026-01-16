
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const logs = await prisma.maintenanceLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
            parts: true,
            technician: true,
            workOrder: {
                select: {
                    woNumber: true,
                    workOrderParts: true
                }
            }
        },
    });

    console.log("Recent Maintenance Logs:");
    logs.forEach((log) => {
        console.log(`Log ID: ${log.id}`);
        console.log(`WO Number: ${log.workOrder.woNumber}`);
        console.log(`Description: ${log.description}`);
        console.log(`Linked Parts (via maintenanceLog.parts):`, log.parts.length);
        console.log(`Linked Parts Data:`, JSON.stringify(log.parts));
        console.log(`Total Parts in WorkOrder:`, log.workOrder.workOrderParts.length);
        console.log("-----------------------------------");
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
