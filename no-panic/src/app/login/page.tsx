import React from 'react';
import styles from './styles.module.css';
import { Metadata } from 'next';
import { LoginForm } from '@/components/login-form';

export const metadata: Metadata = {
  title: 'No Panic | Login',
};

const Login = () => {
  return (
    <div className={styles.container}>
      <LoginForm />
    </div>
  );
};

export default Login;
