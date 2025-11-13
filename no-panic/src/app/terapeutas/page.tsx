'use client';
import { Container } from '@/components/ui/container';
import { Content } from '@/components/ui/content';
import { Header } from '@/components/ui/header';
import React, { useEffect, useState } from 'react';
import styles from './styles.module.css';
import { Card } from '@/components/card';
import axios from 'axios';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { Loader } from '@/components/loader/loader';

export interface Terapeuta {
  nome: string;
  id_usuario: number;
  especialidade: string;
  CRP: string;
  disponibilidade: string;
}

const PageContent = () => {
  const { user } = useAuth();
  const [terapeutas, setTerapeutas] = useState<Terapeuta[]>([]);
  const [especialidade, setEspecialidade] = useState('');
  const [favoritos, setFavoritos] = useState<Terapeuta[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // carrega terapeutas e favoritos do cache
    const terapeutasCache = localStorage.getItem('terapeutas');
    const favoritosCache = localStorage.getItem('favoritos');

    if (terapeutasCache) setTerapeutas(JSON.parse(terapeutasCache));
    if (favoritosCache) setFavoritos(JSON.parse(favoritosCache));

    fetchTerapeutas();
    fetchFavoritos();
  }, []);

  // Buscar terapeutas
  const fetchTerapeutas = async () => {
    setLoading(true);
    try {
      const url = especialidade
        ? `${process.env.NEXT_PUBLIC_SERVER_URL}/terapeutas?especialidade=${especialidade}`
        : `${process.env.NEXT_PUBLIC_SERVER_URL}/terapeutas`;
      const res = await axios.get(url);
      setTerapeutas(res.data.terapeutas);
      localStorage.setItem('terapeutas', JSON.stringify(res.data.terapeutas));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar favoritos do usuário
  const fetchFavoritos = async () => {
    if (!user) return;
    try {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/usuarios/${user.id}/terapeutas`
      );
      setFavoritos(data);
      localStorage.setItem('favoritos', JSON.stringify(data));
    } catch (err) {
      console.error(err);
    }
  };

  // Favoritar um terapeuta
  const handleFavoritar = (novoFavorito: Terapeuta) => {
    const atualizados = [...favoritos, novoFavorito];
    setFavoritos(atualizados);
    localStorage.setItem('favoritos', JSON.stringify(atualizados));
  };

  // Atualiza terapeutas ao filtrar
  useEffect(() => {
    const timer = setTimeout(fetchTerapeutas, 300);
    return () => clearTimeout(timer);
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
            <div className={styles.card_container}>
              {loading && <Loader />}
              {!loading &&
                terapeutas
                  .filter((t) => t.CRP)
                  .map((terapeuta) => (
                    <Card
                      key={terapeuta.id_usuario}
                      terapeuta={terapeuta}
                      favoritos={favoritos}
                      onFavoritar={() => handleFavoritar(terapeuta)}
                    />
                  ))}
            </div>
          </main>
        </Content>
      </Container>
    </>
  );
};

const Page = () => (
  <AuthProvider>
    <PageContent />
  </AuthProvider>
);

export default Page;
