import './globals.css';

export const metadata = {
  title: 'Library Management System',
  description: 'Sistem Operasional Perpustakaan',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}