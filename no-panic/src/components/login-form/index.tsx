'use client';
import React from 'react';
import styles from './styles.module.css';
import Image from 'next/image';
import { Input } from '../ui/input-com-label';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const LoginForm = () => {
  return (
    <main className={styles.main}>
      <div className={styles.intro}>
        <Image src='/logo_azul_sf.png' alt='Logo' height={50} width={50} />
        <h2>Bem vindo de volta</h2>
        <p>Entre em sua conta para continuar</p>
        <Input
          label='Email'
          type='email'
          required
          placeholder='seu@email.com'
        />
        <Input label='Senha' type='password' required placeholder='••••••••' />
        <span className={`${styles.span} ${styles.forget}`}>
          <Link href='#'>Esqueceu a senha?</Link>
        </span>
        <button
          onClick={() => {
            redirect('/terapeutas');
          }}
        >
          Entrar
        </button>
        <span className={styles.span}>
          Não tem uma conta? <Link href='/cadastro'>Cadastre-se</Link>
        </span>
      </div>
    </main>
  );
};
