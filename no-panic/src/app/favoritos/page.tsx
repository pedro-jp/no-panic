'use client';

import React, { useEffect, useState } from 'react';
import styles from './styles.module.css';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui/header';
import { Container } from '@/components/ui/container';
import { Content } from '@/components/ui/content';
import axios from 'axios';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { GridLoader } from 'react-spinners';

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
                <h1 className={styles.title}>Meus Favoritos</h1>
                <p className={styles.subtitle}>
                  Terapeutas salvos para acesso rápido
                </p>
              </div>

              <Favoritos />
            </main>
          </AuthProvider>
        </Content>
      </Container>
    </>
  );
}

const Favoritos = () => {
  const { user } = useAuth();
  const [favoritos, setFavoritos] = React.useState<Terapeuta[]>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getFavoritos();
  }, [user]);

  const getFavoritos = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/usuarios/${user?.id}/terapeutas`
      );
      setFavoritos(data);
      console.log(favoritos);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      loading && (
        <div className={styles.loading}>
          <GridLoader color='purple' />
        </div>
      )
    );

  return favoritos && favoritos.length === 0 ? (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <svg
          width='80'
          height='80'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.5'
        >
          <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
        </svg>
      </div>
      <h2 className={styles.emptyTitle}>Nenhum favorito ainda</h2>
      <p className={styles.emptyText}>
        Adicione terapeutas aos favoritos durante uma chamada para encontrá-los
        facilmente depois
      </p>
    </div>
  ) : (
    <div className={styles.grid}>
      {favoritos &&
        favoritos.map((fav) => (
          <div key={fav.id_usuario} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.avatar}>
                <span>{fav.nome.charAt(0).toUpperCase()}</span>
              </div>
              <button
                // onClick={() => handleRemove(fav.id_usuario)}
                className={styles.favoriteBtn}
                title='Remover dos favoritos'
              >
                <svg
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                >
                  <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
                </svg>
              </button>
            </div>

            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>
                {fav.nome.split(' ')[0]}{' '}
                {fav.nome.split(' ')[fav.nome.split(' ').length - 1]}{' '}
                <span>{fav.disponibilidade}</span>
              </h3>
              <p className={styles.cardId}>{fav.especialidade}</p>
            </div>

            <div className={styles.cardActions}>
              <button
                // onClick={() => handleCall(fav.id_usuario)}
                className={styles.btnPrimary}
              >
                <svg
                  width='18'
                  height='18'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                >
                  <path d='M23 7l-7 5 7 5V7z' />
                  <rect x='1' y='5' width='15' height='14' rx='2' ry='2' />
                </svg>
                <span>Ligar</span>
              </button>
              <button
                //  onClick={() => handleChat(fav.id_usuario)}
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
              <button
                // onClick={() => handleSchedule(fav.id_usuario)}
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
                  <rect x='3' y='4' width='18' height='18' rx='2' ry='2' />
                  <line x1='16' y1='2' x2='16' y2='6' />
                  <line x1='8' y1='2' x2='8' y2='6' />
                  <line x1='3' y1='10' x2='21' y2='10' />
                </svg>
                <span>Agendar</span>
              </button>
            </div>
          </div>
        ))}
    </div>
  );
};
