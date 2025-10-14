'use client';

import React from 'react';
import styles from './styles.module.css';
import { LoginForm } from '@/components/login-form';
import { Provider } from '@/components/provider/auth-provider';

const Login = () => {
  return (
    <div className={styles.container}>
      <Provider>
        <LoginForm />
      </Provider>
    </div>
  );
};

export default Login;
