'use client';

import { StaffCheckIn } from '@/components/staff/StaffCheckIn';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';

export default function StaffPage() {
  return (
    <ProtectedRoute allowedRoles={['staff']}>
      <StaffCheckIn />
    </ProtectedRoute>
  );
}
