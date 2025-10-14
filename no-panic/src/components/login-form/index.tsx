'use client';
import React, { useState } from 'react';
import styles from './styles.module.css';
import Image from 'next/image';
import { Input } from '../ui/input-com-label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export const LoginForm = () => {
  const [email, setEmail] = useState<string | null>();
  const [senha, setSenha] = useState<string | null>();

  const router = useRouter();

  const handleSubmit = async () => {
    if (!email || !senha) return;

    const data = {
      email,
      senha,
    };

    try {
      const response = await fetch('http://127.0.0.1:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Erro ao entrar');
      }
      // const dados = (await response.json()) as any;
      // console.log(dados);

      router.push('/terapeutas');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.intro}>
        <Image src='/logo_azul_sf.png' alt='Logo' height={50} width={50} />
        <h2>Bem vindo de volta</h2>
        <p>Entre em sua conta para continuar</p>
        <Input
          label='Email'
          type='email'
          value={email!}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder='seu@email.com'
        />
        <Input
          label='Senha'
          value={senha!}
          onChange={(e) => setSenha(e.target.value)}
          type='password'
          required
          placeholder='••••••••'
        />
        <span className={`${styles.span} ${styles.forget}`}>
          <Link href='#'>Esqueceu a senha?</Link>
        </span>
        <button
          onClick={() => {
            handleSubmit();
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
