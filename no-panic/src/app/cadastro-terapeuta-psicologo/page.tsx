'use client';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Content } from '@/components/ui/content';
import { Header } from '@/components/ui/header';
import { Input } from '@/components/ui/input-com-label';
import { AuthProvider, useAuth } from '@/context/auth-context';
import React, { useState } from 'react';

import styles from './styles.module.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { redirect } from 'next/navigation';

const Page = () => {
  return (
    <>
      <head>
        <title>Terapeuta | Psicólogo</title>
      </head>
      <Header />
      <Container>
        <Content>
          <AuthProvider>
            <Conteudo />
          </AuthProvider>
        </Content>
      </Container>
    </>
  );
};

export default Page;

const Conteudo = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [especialidade, setEspecialidade] = useState('');
  const [crp, setCrp] = useState('');
  const [disponibilidade, setDisponibilidade] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const id = user?.id;
    try {
      setLoading(true);

      if (!user) return;

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/cadastro-terapeuta`,
        {
          id,
          especialidade,
          crp,
          disponibilidade,
        }
      );
      if (response.status === 201) toast.success('Profissional cadastrado');
      redirect('/');
    } catch (error) {
      console.log(error);
      toast.info('Cadastre novamente');
    } finally {
      setLoading(false);
    }
  };

  if (user?.terapeuta?.CRP) return 'Profissional cadastrado';

  return (
    <main>
      <form className={styles.form} action='submit' onSubmit={handleSubmit}>
        <div>
          <Input
            onChange={(e) => setEspecialidade(e.target.value)}
            label='Especialidade'
            value={especialidade}
          />
          <Input
            onChange={(e) => setDisponibilidade(e.target.value)}
            label='Disponibilidade'
            value={disponibilidade}
          />
        </div>
        <div className={styles.crp}>
          <Input
            onChange={(e) => setCrp(e.target.value)}
            label='CRP'
            className={styles.crp}
            value={crp}
          />
        </div>

        <Button type='submit' disabled={loading}>
          Cadastrar profissional
        </Button>
      </form>
    </main>
  );
};
