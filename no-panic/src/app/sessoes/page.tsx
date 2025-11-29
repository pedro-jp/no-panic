'use client';

import { Container } from '@/components/ui/container';
import { Content } from '@/components/ui/content';
import Header from '@/components/ui/header';
import styles from './styles.module.css';
import React, { useEffect, useState } from 'react';
import { formatarData, getSessoes } from '@/utils';
import { Sessao } from '@/types/types';
import { Provider } from '@/components/provider/auth-provider';
import { useAuth } from '@/context/auth-context';
import { BiVideoOff } from 'react-icons/bi';
import { Loader } from '@/components/loader/loader';
import { Status, Tipo } from '@/enums/enums';
import axios from 'axios';
import { toast } from 'react-toastify';
import Link from 'next/link';

const Page = () => {
  const { user } = useAuth();
  const [sessoes, setSessoes] = useState<Sessao[] | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sessoesCache = localStorage.getItem('sessoes');
    if (sessoesCache) setSessoes(JSON.parse(sessoesCache));

    const fetchData = async () => {
      if (user) {
        try {
          const data = await getSessoes(
            user?.terapeuta?.CRP ? 'terapeuta' : 'usuario',
            user?.id
          );
          setSessoes(data);
          localStorage.setItem('sessoes', JSON.stringify(data));
        } catch (err) {
          console.error('Erro ao buscar sessões:', err);
        }
      }
    };
    fetchData();
  }, [user]);

  const handleConfirmSession = async (status: Status, id_sessao: number) => {
    try {
      setLoading(true);
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/atualizar-sessao/${id_sessao}`,
        {
          status,
        }
      );

      if (response.status === 200) {
        toast.success(
          `Sessão ${status === Status.agendada ? 'agendada' : 'cancelada'}`
        );
        setSessoes((prev) =>
          prev?.map((sessao) =>
            sessao.id_sessao === id_sessao ? { ...sessao, status } : sessao
          )
        );
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <Container>
        <Content>
          {loading && <Loader />}
          <main className={styles.main}>
            {!sessoes ||
              (sessoes.length === 0 && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <BiVideoOff size={60} />
                  </div>
                  <h2 className={styles.emptyTitle}>
                    Nenhuma sessão encontrada
                  </h2>
                  <p className={styles.emptyText}>
                    Agende sessoẽs para encontrá-las aqui
                  </p>
                </div>
              ))}
            <div className={styles.grid}>
              {sessoes
                ?.sort(
                  (a, b) =>
                    new Date(a.data_hora_agendamento).getTime() -
                    new Date(b.data_hora_agendamento).getTime()
                )
                .map((sessao) => (
                  <div key={sessao.id_sessao} className={styles.card}>
                    {/* <div className={styles.cardHeader}>
                    <div className={styles.avatar}>
                      <span>{sessao.nome.charAt(0).toUpperCase()}</span>
                    </div>
                  </div> */}
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle}>
                        {sessao.nome.split(' ')[0]}{' '}
                        {sessao.nome.split(' ').length > 1 &&
                          sessao.nome.split(' ')[
                            sessao.nome.split(' ').length - 1
                          ]}{' '}
                        <span>
                          {formatarData(sessao.data_hora_agendamento)}
                        </span>
                      </h3>
                    </div>
                    <div className={styles.cardActions}>
                      <Link
                        href={`/sessao/${sessao.uuid}/${user?.nome}`}
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
                          <rect
                            x='1'
                            y='5'
                            width='15'
                            height='14'
                            rx='2'
                            ry='2'
                          />
                        </svg>
                        <span>Ligar</span>
                      </Link>
                      {user?.terapeuta?.CRP ? (
                        <div className={styles.terapeuta_actions}>
                          {sessao.status !== Status.agendada && (
                            <button
                              className={styles.agendada}
                              onClick={() =>
                                handleConfirmSession(
                                  Status.agendada,
                                  sessao.id_sessao
                                )
                              }
                            >
                              Aceitar
                            </button>
                          )}
                          {sessao.status !== Status.cancelada && (
                            <button
                              className={styles.cancelar}
                              onClick={() =>
                                handleConfirmSession(
                                  Status.cancelada,
                                  sessao.id_sessao
                                )
                              }
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      ) : (
                        sessao.status !== Status.cancelada && (
                          <button
                            onClick={() =>
                              handleConfirmSession(
                                Status.cancelada,
                                sessao.id_sessao
                              )
                            }
                            className={`${styles.btnSecondary} ${styles.cancelar}`}
                          >
                            <span>Cancelar</span>
                          </button>
                        )
                      )}
                      <span
                        className={styles.status}
                        style={{
                          color:
                            sessao?.status === Status.agendada
                              ? 'orange'
                              : sessao?.status === Status.concluida
                              ? 'rgba(0, 128, 60, 0.9)'
                              : sessao?.status === Status.cancelada
                              ? '#B33A3A'
                              : 'gray',
                        }}
                      >
                        {sessao.status}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </main>
        </Content>
      </Container>
    </>
  );
};

const PageWithProvider = () => {
  return (
    <Provider>
      <Page />
    </Provider>
  );
};
export default PageWithProvider;
