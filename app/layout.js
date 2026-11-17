import "./globals.css";

export const metadata = {
  title: "FileDrop — Secure document collection",
  description: "Upload and collect documents securely."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
