'use client';
import { Container } from '@/components/ui/container';
import { Content } from '@/components/ui/content';
import Header from '@/components/ui/header';
import React, { useEffect, useState } from 'react';
import styles from './styles.module.css';
import { Card } from '@/components/card';
import axios from 'axios';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { Loader } from '@/components/loader/loader';
import Pagination from '@mui/material/Pagination';
import { Footer } from '@/components/ui/footer';

export interface Terapeuta {
  nome: string;
  id_usuario: number;
  especialidade: string;
  CRP: string;
  disponibilidade: string;
  total_sessoes_concluidas: number;
}

export interface PageMetadata {
  current_page: number;
  limit: number;
  total_pages: number;
  total_records: number;
}

const PageContent = () => {
  const { user } = useAuth();
  const [terapeutas, setTerapeutas] = useState<Terapeuta[]>([]);
  const [especialidade, setEspecialidade] = useState('');
  const [favoritos, setFavoritos] = useState<Terapeuta[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [metadata, setMetadata] = useState<PageMetadata>();
  const [firstLoad, setFirstLoad] = useState(true);

  useEffect(() => {
    const terapeutasCache = localStorage.getItem('terapeutas');
    const favoritosCache = localStorage.getItem('favoritos');
    if (terapeutasCache) setTerapeutas(JSON.parse(terapeutasCache));
    if (favoritosCache) setFavoritos(JSON.parse(favoritosCache));
    fetchTerapeutas();
    fetchFavoritos();
    setFirstLoad(false);
  }, [page]);

  const fetchTerapeutas = async (pageNumber = 1) => {
    try {
      const url = especialidade
        ? `${process.env.NEXT_PUBLIC_SERVER_URL}/terapeutas?especialidade=${especialidade}&page=${pageNumber}&limit=9`
        : `${process.env.NEXT_PUBLIC_SERVER_URL}/terapeutas?page=${pageNumber}&limit=9`;

      const res = await axios.get(url);

      setTerapeutas(res.data.terapeutas);
      setMetadata(res.data.metadata);

      localStorage.setItem('terapeutas', JSON.stringify(res.data.terapeutas));
    } catch (err) {
      console.error(err);
    }
  };

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

  useEffect(() => {
    fetchTerapeutas(page);
    fetchFavoritos();
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTerapeutas(1);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [especialidade]);

  const handleFavoritar = (novo: Terapeuta) => {
    const atualizados = [...favoritos, novo];
    setFavoritos(atualizados);
    localStorage.setItem('favoritos', JSON.stringify(atualizados));
  };

  const handlePageChange = (_: any, value: number) => {
    setPage(value);
  };

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
            {metadata && (
              <div className={styles.root}>
                <Pagination
                  count={metadata?.total_pages || 1}
                  page={page}
                  onChange={handlePageChange}
                  color='primary'
                />
              </div>
            )}
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
