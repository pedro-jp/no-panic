'use client';
import { useAuth } from '@/context/auth-context';
import { useEffect } from 'react';

export const LoadUser = () => {
  const { load, user } = useAuth();

  useEffect(() => {
    load();
  }, [user]); //eslint-disable-line
  return '';
};
