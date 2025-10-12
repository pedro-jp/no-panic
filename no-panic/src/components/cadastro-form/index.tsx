'use client';
import React from 'react';
import styles from './styles.module.css';
import Image from 'next/image';
import { Input } from '../ui/input-com-label';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const CadastroForm = () => {
  return (
    <main className={styles.main}>
      <div className={styles.intro}>
        <Image src='/logo_azul_sf.png' alt='Logo' height={50} width={50} />
        <h2>Faça seu Cadastro</h2>
        <p>Crie sua conta para começar a conversar</p>
        <Input label='Nome' type='text' required placeholder='Zézinho' />
        <Input
          label='Email'
          type='email'
          required
          placeholder='seu@email.com'
        />
        <Input label='Senha' type='password' required placeholder='••••••••' />

        <button
          onClick={() => {
            redirect('/terapeutas');
          }}
        >
          Criar conta
        </button>
        <span className={styles.span}>
          Já tem uma conta? <Link href='/entrar'>Entrar</Link>
        </span>
      </div>
    </main>
  );
};
