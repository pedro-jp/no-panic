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

export interface Terapeuta {
  nome: string;
  id_usuario: number;
  especialidade: string;
  CRP: string;
  disponibilidade: string;
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

  // ---------------------------
  // Buscar terapeutas paginados
  // ---------------------------
  const fetchTerapeutas = async (pageNumber: number) => {
    try {
      const baseUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/terapeutas`;

      const params = new URLSearchParams({
        page: String(pageNumber),
        limit: '9', // fixo como você pediu
      });

      if (especialidade) {
        params.append('especialidade', especialidade);
      }

      const url = `${baseUrl}?${params.toString()}`;

      const res = await axios.get(url);

      setTerapeutas(res.data.terapeutas);
      setMetadata(res.data.metadata);

      // Mantém localStorage
      localStorage.setItem('terapeutas', JSON.stringify(res.data.terapeutas));
    } catch (err) {
      console.error(err);
    } finally {
    }
  };

  // ---------------------
  // Buscar favoritos
  // ---------------------
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

  // ---------------------
  // Primeira carga
  // ---------------------
  useEffect(() => {
    const terapeutasCache = localStorage.getItem('terapeutas');
    const favoritosCache = localStorage.getItem('favoritos');

    if (terapeutasCache) setTerapeutas(JSON.parse(terapeutasCache));
    if (favoritosCache) setFavoritos(JSON.parse(favoritosCache));

    fetchTerapeutas(page);
    fetchFavoritos();
  }, []);

  // ----------------------------------
  // Atualizar ao mudar de página
  // ----------------------------------
  useEffect(() => {
    fetchTerapeutas(page);
  }, [page]);

  // ----------------------------------
  // Buscar novamente ao trocar filtro
  // ----------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchTerapeutas(1);
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
                  count={metadata.total_pages}
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
