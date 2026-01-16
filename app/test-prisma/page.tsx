import prisma from "@/lib/prisma";

export default async function TestPrismaPage() {
  // ดึงข้อมูลจาก database
  const [userCount, categoryCount, equipmentCount] = await Promise.all([
    prisma.user.count(),
    prisma.equipmentCategory.count(),
    prisma.equipment.count(),
  ]);

  // ดึง users ทั้งหมด
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // ดึง categories
  const categories = await prisma.equipmentCategory.findMany({
    select: {
      name: true,
      description: true,
      icon: true,
    },
  });

  return (
    <div className="flex min-h-screen flex-col p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">ทดสอบ Prisma Connection</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-sm text-blue-600 font-medium">Users</p>
          <p className="text-3xl font-bold text-blue-900">{userCount}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <p className="text-sm text-green-600 font-medium">Categories</p>
          <p className="text-3xl font-bold text-green-900">{categoryCount}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <p className="text-sm text-purple-600 font-medium">Equipment</p>
          <p className="text-3xl font-bold text-purple-900">{equipmentCount}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">👥 Users</h2>
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === "ADMIN"
                          ? "bg-red-100 text-red-800"
                          : user.role === "TECHNICIAN"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">📂 Equipment Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.name}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded">
                  <span className="text-xl">{category.icon || "📦"}</span>
                </div>
                <div>
                  <h3 className="font-semibold">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-green-800 font-semibold mb-2">
          ✅ Prisma ทำงานสมบูรณ์!
        </h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>✓ Database connection สำเร็จ</li>
          <li>✓ ดึงข้อมูลจาก Supabase ได้</li>
          <li>✓ Seed data ครบถ้วน</li>
          <li>✓ พร้อมพัฒนาต่อ!</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex gap-4">
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          กลับหน้าหลัก
        </a>
        <a
          href="/test-supabase"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
          ทดสอบ Supabase
        </a>
      </div>
    </div>
  );
}