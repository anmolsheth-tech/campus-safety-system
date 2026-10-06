import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, DataTable, Badge, Avatar, PageHeader } from '@/components/ui';
import { adminService } from '@/services/adminService';
import { format } from 'date-fns';
import { Users, Shield, Hash, Phone } from 'lucide-react';

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => adminService.getUsers(page),
  });

  const users = Array.isArray(usersData) ? usersData : (usersData as any)?.items || [];
  const totalPages = Array.isArray(usersData) ? 1 : (usersData as any)?.total_pages || 1;

  const columns = [
    {
      key: 'name',
      header: 'Identity & Account',
      render: (item: typeof users[0]) => (
        <div className="flex items-center gap-3">
          <Avatar name={item.full_name} size="sm" />
          <div>
            <p className="text-xs font-bold text-slate-900">{item.full_name}</p>
            <p className="text-[11px] text-slate-500 font-mono">{item.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'System Role',
      render: (item: typeof users[0]) => (
        <Badge
          variant={
            item.role === 'admin'
              ? 'danger'
              : item.role === 'security'
              ? 'warning'
              : 'info'
          }
        >
          {item.role}
        </Badge>
      ),
    },
    {
      key: 'student_id',
      header: 'Student / Staff ID',
      render: (item: typeof users[0]) => (
        <span className="text-xs font-mono text-slate-600">
          {item.student_id || '—'}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Emergency Phone',
      render: (item: typeof users[0]) => (
        <span className="text-xs font-mono text-slate-600">{item.phone || '—'}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Joined Date',
      sortable: true,
      render: (item: typeof users[0]) => (
        <span className="text-xs text-slate-500 font-mono">
          {format(new Date(item.created_at), 'MMM d, yyyy')}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="User & Security Directory"
        subtitle="View registered students, campus police officers, and administrators."
        badge={`${users.length} Users`}
        badgeVariant="info"
      />

      <Card padding="none">
        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          keyExtractor={(item) => item.id}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          emptyMessage="No registered users found"
        />
      </Card>
    </div>
  );
}
