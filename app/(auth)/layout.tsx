export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <span className="text-white font-bold text-2xl">MS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            ระบบบริหารงานซ่อมบำรุง
          </h1>
          <p className="text-gray-600 mt-2">Maintenance Management System</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">{children}</div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-8">
          © 2025 Maintenance System. All rights reserved.
        </p>
      </div>
    </div>
  );
}