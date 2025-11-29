'use client';
import { AuthProvider, useAuth } from '@/context/auth-context';
import React, { useEffect } from 'react';

export const Page = () => {
  return (
    <AuthProvider>
      <Component />
    </AuthProvider>
  );
};

const Component = () => {
  const { logout } = useAuth();
  useEffect(() => {
    logout();
  }, []);
  return '';
};

export default Page;
