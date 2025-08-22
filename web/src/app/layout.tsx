import './globals.css'; // <- required for Tailwind & global styles

export const metadata = { title: 'Reverse Glassdoor for Trades' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* optional: set your default theme colors on body */}
      <body className="bg-slate-900 text-white">{children}</body>
    </html>
  );
}
