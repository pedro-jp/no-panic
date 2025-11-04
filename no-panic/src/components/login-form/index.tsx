'use client';
import React, { useState } from 'react';
import styles from './styles.module.css';
import Image from 'next/image';
import { Input } from '../ui/input-com-label';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Button } from '../ui/button';

export const LoginForm = () => {
  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');

  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !senha) return;
    try {
      login(email, senha);
    } finally {
    }
  };

  return (
    <form className={styles.main} onSubmit={(e) => handleSubmit(e)}>
      <div className={styles.intro}>
        <Image src='/logo_azul_sf.png' alt='Logo' height={50} width={50} />
        <h2>Bem vindo de volta</h2>
        <p>Entre em sua conta para continuar</p>
        <Input
          label='Email'
          type='email'
          value={email}
          autoComplete='email'
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder='seu@email.com'
        />
        <Input
          label='Senha'
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          type='password'
          required
          placeholder='••••••••'
        />
        <span className={`${styles.span} ${styles.forget}`}>
          <Link href='#'>Esqueceu a senha?</Link>
        </span>
        <Button type='submit' disabled={isLoading}>
          Entrar
        </Button>
        <span className={styles.span}>
          Não tem uma conta? <Link href='/cadastro'>Cadastre-se</Link>
        </span>
      </div>
    </form>
  );
};
