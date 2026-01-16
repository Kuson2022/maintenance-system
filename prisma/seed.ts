import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // ========================================
  // 1. Expense Types
  // ========================================
  console.log("📦 Seeding expense types...");
  
  const expenseTypes = await Promise.all([
    prisma.expenseType.upsert({
      where: { name: "Labor Cost" },
      update: {},
      create: {
        name: "Labor Cost",
        description: "ค่าแรงงานช่าง",
      },
    }),
    prisma.expenseType.upsert({
      where: { name: "Spare Parts" },
      update: {},
      create: {
        name: "Spare Parts",
        description: "ค่าอะไหล่",
      },
    }),
    prisma.expenseType.upsert({
      where: { name: "External Service" },
      update: {},
      create: {
        name: "External Service",
        description: "ค่าบริการภายนอก",
      },
    }),
    prisma.expenseType.upsert({
      where: { name: "Transportation" },
      update: {},
      create: {
        name: "Transportation",
        description: "ค่าเดินทาง",
      },
    }),
    prisma.expenseType.upsert({
      where: { name: "Others" },
      update: {},
      create: {
        name: "Others",
        description: "ค่าใช้จ่ายอื่นๆ",
      },
    }),
  ]);

  console.log(`✅ Created ${expenseTypes.length} expense types`);

  // ========================================
  // 2. Equipment Categories
  // ========================================
  console.log("📦 Seeding equipment categories...");

  const categories = await Promise.all([
    prisma.equipmentCategory.upsert({
      where: { name: "HVAC" },
      update: {},
      create: {
        name: "HVAC",
        description: "ระบบปรับอากาศและระบายอากาศ",
        icon: "wind",
      },
    }),
    prisma.equipmentCategory.upsert({
      where: { name: "Electrical" },
      update: {},
      create: {
        name: "Electrical",
        description: "ระบบไฟฟ้า",
        icon: "zap",
      },
    }),
    prisma.equipmentCategory.upsert({
      where: { name: "Plumbing" },
      update: {},
      create: {
        name: "Plumbing",
        description: "ระบบประปา",
        icon: "droplet",
      },
    }),
    prisma.equipmentCategory.upsert({
      where: { name: "Elevator" },
      update: {},
      create: {
        name: "Elevator",
        description: "ลิฟต์และบันไดเลื่อน",
        icon: "arrow-up-down",
      },
    }),
    prisma.equipmentCategory.upsert({
      where: { name: "Fire Safety" },
      update: {},
      create: {
        name: "Fire Safety",
        description: "ระบบดับเพลิง",
        icon: "flame",
      },
    }),
    prisma.equipmentCategory.upsert({
      where: { name: "Security" },
      update: {},
      create: {
        name: "Security",
        description: "ระบบรักษาความปลอดภัย",
        icon: "shield",
      },
    }),
    prisma.equipmentCategory.upsert({
      where: { name: "Others" },
      update: {},
      create: {
        name: "Others",
        description: "อื่นๆ",
        icon: "wrench",
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} equipment categories`);

  // ========================================
  // 3. Admin User (ตัวอย่าง)
  // ========================================
  console.log("👤 Seeding admin user...");

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@maintenance.local" },
    update: {},
    create: {
      email: "admin@maintenance.local",
      name: "System Admin",
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);

  // ========================================
  // 4. Sample Technician
  // ========================================
  console.log("👷 Seeding sample technician...");

  const technicianUser = await prisma.user.upsert({
    where: { email: "technician@maintenance.local" },
    update: {},
    create: {
      email: "technician@maintenance.local",
      name: "ช่างตัวอย่าง",
      role: "TECHNICIAN",
      status: "ACTIVE",
      phone: "081-234-5678",
    },
  });

  console.log(`✅ Created technician user: ${technicianUser.email}`);

  // ========================================
  // 5. Sample Regular User
  // ========================================
  console.log("👤 Seeding sample user...");

  const regularUser = await prisma.user.upsert({
    where: { email: "user@maintenance.local" },
    update: {},
    create: {
      email: "user@maintenance.local",
      name: "ผู้ใช้ตัวอย่าง",
      role: "USER",
      status: "ACTIVE",
    },
  });

  console.log(`✅ Created regular user: ${regularUser.email}`);

  // ========================================
  // 6. Sample Equipment
  // ========================================
  console.log("🔧 Seeding sample equipment...");

  const hvacCategory = categories.find((c) => c.name === "HVAC");

  if (hvacCategory) {
    const equipment = await prisma.equipment.upsert({
      where: { code: "AC-001" },
      update: {},
      create: {
        code: "AC-001",
        name: "แอร์ชั้น 3 ห้อง 301",
        categoryId: hvacCategory.id,
        type: "Split Type",
        manufacturer: "Daikin",
        serialNumber: "DAIKIN-2024-001",
        location: "ชั้น 3 - ห้อง 301",
        installationDate: new Date("2024-01-15"),
        warrantyExpiry: new Date("2027-01-15"),
        cost: 45000,
        status: "ACTIVE",
        qrCode: "QR-AC-001",
        description: "เครื่องปรับอากาศ 24,000 BTU",
        responsiblePersonId: technicianUser.id,
      },
    });

    console.log(`✅ Created sample equipment: ${equipment.name}`);
  }

  // ========================================
  // 7. Sample Spare Parts
  // ========================================
  console.log("🔩 Seeding sample spare parts...");

  const spareParts = await Promise.all([
    prisma.sparePart.upsert({
      where: { code: "PART-001" },
      update: {},
      create: {
        code: "PART-001",
        name: "ไส้กรองอากาศ Standard",
        category: "HVAC",
        unit: "ชิ้น",
        unitPrice: 350,
        stockQuantity: 50,
        minStockLevel: 10,
        supplier: "บริษัท ABC จำกัด",
      },
    }),
    prisma.sparePart.upsert({
      where: { code: "PART-002" },
      update: {},
      create: {
        code: "PART-002",
        name: "น้ำยาแอร์ R32",
        category: "HVAC",
        unit: "กระป๋อง",
        unitPrice: 2500,
        stockQuantity: 20,
        minStockLevel: 5,
        supplier: "บริษัท XYZ จำกัด",
      },
    }),
  ]);

  console.log(`✅ Created ${spareParts.length} spare parts`);

  console.log("\n✨ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });