import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Cloud Clips Admin",
  description: "Admin dashboard for Cloud Clips",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>
          <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />
            <main
              style={{
                flex: 1,
                padding: "32px",
                overflowY: "auto",
                maxWidth: "calc(100vw - 220px)",
              }}
            >
              {children}
            </main>
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
