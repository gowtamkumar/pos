import type { Metadata } from "next";
import { ToastContainer } from "../components/toast-container";
import { AuthProvider } from "../lib/auth-context";
import { QueryProvider } from "../lib/query-provider";
import { ThemeProvider } from "../lib/theme-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Retail POS — Fast Point of Sale Terminal",
  description: "Retail Point of Sale Terminal with Cash Engine and AI Insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" className="light" suppressHydrationWarning>
      <body
        className="font-sans antialiased bg-background text-foreground transition-colors duration-300"
      >
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              {children}
              <ToastContainer />
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
