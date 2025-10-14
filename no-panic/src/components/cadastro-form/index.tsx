'use client';
import React, { useState } from 'react';
import styles from './styles.module.css';
import Image from 'next/image';
import { Input } from '../ui/input-com-label';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const CadastroForm = () => {
  const [cpf, setCpf] = useState(''); // armazenará apenas os dígitos
  const [nome, setNome] = useState<string | null>();
  const [senha, setSenha] = useState<string | null>();
  const [email, setEmail] = useState<string | null>();

  // Função para formatar CPF como 000.000.000-00
  const formatCPF = (digits: string) => {
    const d = digits.slice(0, 11); // limita a 11 dígitos
    if (!d) return '';
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(
      9,
      11
    )}`;
  };

  // Handle change do input de CPF
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setCpf(raw);
  };

  const handleSubmit = async () => {
    if (!nome || !cpf || !email || !senha) return;

    const data = {
      nome,
      cpf,
      email,
      senha,
    };

    try {
      const response = await fetch('http://127.0.0.1:5000/cadastro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Erro ao cadastrar');
      }

      redirect('/terapeutas');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.intro}>
        <Image src='/logo_azul_sf.png' alt='Logo' height={50} width={50} />
        <h2>Faça seu Cadastro</h2>
        <p>Crie sua conta para começar a conversar</p>
        <Input
          value={nome!}
          onChange={(e) => setNome(e.target.value)}
          label='Nome'
          type='text'
          required
          placeholder='Zézinho'
        />

        <Input
          label='CPF'
          type='text'
          required
          placeholder='123.456.789-00'
          value={formatCPF(cpf)}
          onChange={handleCPFChange}
        />

        <Input
          label='Email'
          type='email'
          required
          value={email!}
          onChange={(e) => setEmail(e.target.value)}
          placeholder='seu@email.com'
        />
        <Input
          value={senha!}
          onChange={(e) => setSenha(e.target.value)}
          label='Senha'
          type='password'
          required
          placeholder='••••••••'
        />

        <button
          onClick={() => {
            handleSubmit();
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
