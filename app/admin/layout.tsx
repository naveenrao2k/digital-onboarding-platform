import { AuthProvider } from '@/lib/auth-context';
import AdminSidebar from '@/components/navigation/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}