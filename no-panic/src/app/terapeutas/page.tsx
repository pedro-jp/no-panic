'use client';
import { Container } from '@/components/ui/container';
import { Content } from '@/components/ui/content';
import { Header } from '@/components/ui/header';
// import { Metadata } from 'next';
import React, { useEffect, useState } from 'react';
import styles from './styles.module.css';
import { Card } from '@/components/card';
import axios from 'axios';
import { AuthProvider } from '@/context/auth-context';

// export const metadata: Metadata = {
//   title: 'Terapeutas | NoPanic',
// };

export interface Terapeuta {
  nome: string;
  id_usuario: number;
  especialidade: string;
  CRP: string;
  disponibilidade: string;
}

const Page = () => {
  const [terapeutas, setTerapeutas] = useState<Terapeuta[]>();
  const [especialidade, setEspecialidade] = useState<string>('');

  const fetchTerapeutas = async () => {
    if (especialidade) {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/terapeutas?especialidade=${especialidade}`
        );
        const terapeutasData = response.data;
        return await terapeutasData;
      } catch (error) {
        console.log(error);
      }
    }

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/terapeutas`
      );
      const terapeutasData = response.data;
      return await terapeutasData;
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const terapeutas = await fetchTerapeutas();
      setTerapeutas(terapeutas!);
    };
    fetchData();
  }, [especialidade]);

  return (
    <>
      <Header />
      <Container>
        <Content>
          <main className={styles.main}>
            <div className={styles.header}>
              <h2>Nossos terapeutas</h2>
              <p>Encontre o profissional ideal para você</p>
            </div>
            <input
              className={styles.search}
              type='text'
              placeholder='Buscar por especialidade'
              value={especialidade}
              onChange={(e) => setEspecialidade(e.target.value)}
            />
            <AuthProvider>
              <div className={styles.card_container}>
                {terapeutas
                  ?.filter((terapeuta) => terapeuta.CRP)
                  .map((terapeuta) => (
                    <Card key={terapeuta.id_usuario} terapeuta={terapeuta} />
                  ))}
              </div>
            </AuthProvider>
          </main>
        </Content>
      </Container>
    </>
  );
};

export default Page;
