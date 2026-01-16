
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const logId = "3eadc23d-f96b-45fb-b4bc-afd6b7e634c1"; // The same log ID from before

    // Get the log and its parts
    const log = await prisma.maintenanceLog.findUnique({
        where: { id: logId },
        include: {
            workOrder: {
                include: {
                    expenses: true
                }
            },
            parts: true
        }
    });

    if (!log) {
        console.log("Log not found");
        return;
    }

    console.log(`Checking Expenses for Log: ${log.id}`);

    // Find expenses linked to this log
    const linkedExpenses = await prisma.expense.findMany({
        where: { maintenanceLogId: logId }
    });

    console.log(`Directly Linked Expenses: ${linkedExpenses.length}`);
    linkedExpenses.forEach(e => {
        console.log(` - ${e.description} (${e.total})`);
    });

    console.log(`-----------------------------------`);
    console.log(`All Expenses in Work Order: ${log.workOrder.expenses.length}`);
    log.workOrder.expenses.forEach(e => {
        console.log(` - ID: ${e.id}, LogID: ${e.maintenanceLogId}, Desc: ${e.description}, Amount: ${e.total}`);
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
