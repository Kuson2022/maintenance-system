import { createClient } from "@/lib/supabase/server";

export default async function TestSupabasePage() {
  const supabase = await createClient();
  
  // ทดสอบ connection
  const { data, error } = await supabase.from("users").select("count");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-2xl w-full space-y-6">
        <h1 className="text-3xl font-bold">ทดสอบ Supabase Connection</h1>
        
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">สถานะการเชื่อมต่อ</h2>
          
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-red-800 font-medium">❌ เชื่อมต่อไม่สำเร็จ</p>
              <p className="text-red-600 text-sm mt-2">{error.message}</p>
              <div className="mt-4 text-sm">
                <p className="font-medium mb-2">ตรวจสอบ:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>ค่า NEXT_PUBLIC_SUPABASE_URL ใน .env.local</li>
                  <li>ค่า NEXT_PUBLIC_SUPABASE_ANON_KEY ใน .env.local</li>
                  <li>สร้างตาราง users ใน Supabase แล้วหรือยัง</li>
                  <li>Restart dev server: npm run dev</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <p className="text-green-800 font-medium">✅ เชื่อมต่อสำเร็จ!</p>
              <p className="text-green-600 text-sm mt-2">
                Supabase client ทำงานได้ปกติ
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-blue-800 font-medium">ℹ️ ข้อมูล Environment</p>
            <div className="mt-2 space-y-1 text-sm">
              <p>
                <span className="font-medium">SUPABASE_URL:</span>{" "}
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Not Set"}
              </p>
              <p>
                <span className="font-medium">ANON_KEY:</span>{" "}
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Not Set"}
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            กลับหน้าหลัก
          </a>
        </div>
      </div>
    </div>
  );
}