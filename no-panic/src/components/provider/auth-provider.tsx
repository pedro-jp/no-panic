import { AuthProvider } from '@/context/auth-context';
import React from 'react';

export const Provider = ({ children }: { children: React.ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};
