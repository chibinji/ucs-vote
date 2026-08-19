import type { Metadata } from "next";
import { Fira_Code, Josefin_Sans, Poppins } from "next/font/google";
import "./globals.css";

const display = Josefin_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Poppins({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const code = Fira_Code({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "UCS Election — Vote here",
  description:
    "UNZA Computer Society election. Eligible voters sign in with computer number and CS email.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${code.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col text-ink">{children}</body>
    </html>
  );
}
