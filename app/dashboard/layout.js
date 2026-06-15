import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Dashboard - Library Management System',
  description: 'Dashboard perpustakaan',
};

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}