import { Metadata } from "next";
import { ScanPage } from "./scan-client";

export const metadata: Metadata = {
    title: "สแกน QR Code | ระบบซ่อมบำรุง",
    description: "สแกน QR Code เพื่อดูข้อมูลเครื่องจักร",
};

export default function Page() {
    return <ScanPage />;
}
