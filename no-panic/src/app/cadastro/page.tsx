import React from 'react';
import styles from './styles.module.css';
import { Metadata } from 'next';
import { CadastroForm } from '@/components/cadastro-form';

export const metadata: Metadata = {
  title: 'No Panic | Cadastro',
};

const Cadastro = () => {
  return (
    <div className={styles.container}>
      <CadastroForm />
    </div>
  );
};

export default Cadastro;
