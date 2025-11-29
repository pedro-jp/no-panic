'use client';

import React, { useEffect, useState } from 'react';
import styles from './styles.module.css';
import { redirect, useRouter } from 'next/navigation';
import Header from '@/components/ui/header';
import { Container } from '@/components/ui/container';
import { Content } from '@/components/ui/content';
import axios from 'axios';
import { AuthProvider, useAuth, User } from '@/context/auth-context';
import { GridLoader } from 'react-spinners';
import { Loader } from '@/components/loader/loader';
import { Router } from 'next/router';

interface Terapeuta {
  nome: string;
  id_usuario: number;
  especialidade: string;
  CRP: string;
  criadoEm: Date;
  disponibilidade: string;
}

export default function Page() {
  const router = useRouter();

  // const handleRemove = (id: string) => {
  //   removeFavorite(id)
  //   setFavoritos(getFavorites())
  // }

  const handleCall = (id: string) => {
    router.push(`/?call=${id}`);
  };

  const handleChat = (id: string) => {
    router.push(`/chat?id=${id}`);
  };

  const handleSchedule = (id: string) => {
    router.push(`/agendar?id=${id}`);
  };

  return (
    <>
      <Header />
      <Container>
        <Content>
          <AuthProvider>
            <main className={styles.main}>
              <div className={styles.pageHeader}>
                <h2 className={styles.title}>Meus Pacientes</h2>
                <p className={styles.subtitle}>Pacientes salvos</p>
              </div>

              <Pacientes />
            </main>
          </AuthProvider>
        </Content>
      </Container>
    </>
  );
}

const Pacientes = () => {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<User[]>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Carrega do cache ao montar
  useEffect(() => {
    const pacientesCache = localStorage.getItem('pacientes');
    if (pacientesCache) setPacientes(JSON.parse(pacientesCache));

    if (user) getPacientes();
  }, [user]);

  const getPacientes = async () => {
    if (!user) return;
    try {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/terapeuta/${user.id}/usuarios`
      );
      setPacientes(data);
      localStorage.setItem('pacientes', JSON.stringify(data)); // salva no localStorage
    } catch (e) {
      console.error(e);
    }
  };

  const criarChat = async (meuId: number, outroId: number) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/chat/criar/${meuId}/${outroId}`,
        { method: 'POST' }
      );

      const data = await res.json();

      console.log(data);

      // Abrir a página do chat
      router.push(`/chats?u=${data.id_conversa}`);
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
    }
  };
  if (user && !user.terapeuta?.CRP) router.push('/favoritos');

  if (loading) return <Loader />;

  return (
    <div className={styles.grid}>
      {user &&
        pacientes?.map((paciente, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.avatar}>
                <span>{paciente.nome.charAt(0).toUpperCase()}</span>
              </div>
            </div>
            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>
                {paciente.nome.split(' ')[0]}{' '}
                {paciente.nome.split(' ').length > 1 &&
                  paciente.nome.split(' ')[
                    paciente.nome.split(' ').length - 1
                  ]}{' '}
                <span>{paciente.cpf}</span>
              </h3>
            </div>
            <div className={styles.cardActions}>
              <button
                onClick={() => criarChat(user.id, paciente.id)}
                className={styles.btnSecondary}
              >
                <svg
                  width='18'
                  height='18'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                >
                  <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
                </svg>
                <span>Chat</span>
              </button>
            </div>
          </div>
        ))}
    </div>
  );
};
