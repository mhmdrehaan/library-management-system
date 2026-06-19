import './globals.css';

export const metadata = {
  title: 'Library Management System',
  description: 'Sistem Operasional Perpustakaan',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): React.ReactElement {
  return (
    <html lang="id">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
