import "./globals.css";

export const metadata = {
  title: "Arboris — Family Heritage",
  description: "A family tree management and visualization platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
