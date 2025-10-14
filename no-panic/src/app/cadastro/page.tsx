'use client';
import React from 'react';
import styles from './styles.module.css';
import { CadastroForm } from '@/components/cadastro-form';
import { Provider } from '@/components/provider/auth-provider';

const Cadastro = () => {
  return (
    <div className={styles.container}>
      <title>Cadastro | NoPanic</title>
      <Provider>
        <CadastroForm />
      </Provider>
    </div>
  );
};

export default Cadastro;
