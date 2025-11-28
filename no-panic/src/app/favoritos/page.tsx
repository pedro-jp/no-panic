'use client';

import React, { useEffect, useState } from 'react';
import styles from './styles.module.css';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/header';
import { Container } from '@/components/ui/container';
import { Content } from '@/components/ui/content';
import axios from 'axios';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { Loader } from '@/components/loader/loader';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { BiCalendar, BiCalendarEvent, BiTime } from 'react-icons/bi';

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

  const handleCall = (id: string) => {
    router.push(`/?call=${id}`);
  };

  const handleChat = (id: string) => {
    router.push(`/chat?id=${id}`);
  };

  return (
    <>
      <Header />
      <Container>
        <Content>
          <AuthProvider>
            <main className={styles.main}>
              <div className={styles.pageHeader}>
                <h2 className={styles.title}>Meus Favoritos</h2>
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

type StatusType = {
  status: boolean;
  id: number | null;
};

const Favoritos = () => {
  const { user } = useAuth();
  const [favoritos, setFavoritos] = React.useState<Terapeuta[]>([]);
  const [loading, setLoading] = useState(false);
  const [agendar, setAgendar] = useState<StatusType>({
    status: false,
    id: null,
  });
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [horaAgendamento, setHoraAgendamento] = useState('');

  useEffect(() => {
    const favoritosCache = localStorage.getItem('favoritos');
    if (favoritosCache) setFavoritos(JSON.parse(favoritosCache));

    if (user) getFavoritos();
  }, [user]);

  const getFavoritos = async () => {
    if (!user) return;
    try {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/usuarios/${user.id}/terapeutas`
      );
      setFavoritos(data);
      localStorage.setItem('favoritos', JSON.stringify(data));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAgendar = async (id_terapeuta: number) => {
    if (!dataAgendamento || !horaAgendamento) {
      toast.info('Selecione uma data e hora para agendar.');
      return;
    }

    setLoading(true);

    const dataHoraFormatada = `${dataAgendamento} ${horaAgendamento}:00`;

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_SERVER_URL}/sessao`, {
        id_usuario: user?.id,
        id_terapeuta,
        data_hora_agendamento: dataHoraFormatada,
      });

      toast.success('Sessão agendada com sucesso!');
      setDataAgendamento('');
      setHoraAgendamento('');
      setAgendar({ status: false, id: null });
    } catch (e) {
      console.error(e);
      toast.info('Agende novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFavoritar = (novoFavorito: Terapeuta) => {
    const atualizados = [...favoritos, novoFavorito];
    setFavoritos(atualizados);
    localStorage.setItem('favoritos', JSON.stringify(atualizados));
  };

  function formatarDataAgendamento(
    dataAgendamento: string,
    horaAgendamento?: string
  ) {
    const horaInvalida =
      !horaAgendamento ||
      horaAgendamento.trim() === '' ||
      horaAgendamento === '00:00' ||
      horaAgendamento === '00' ||
      horaAgendamento === '0' ||
      horaAgendamento === '0:00';

    const agora = new Date();
    const horaParaUsar = horaInvalida
      ? `${agora.getHours().toString().padStart(2, '0')}:${agora
          .getMinutes()
          .toString()
          .padStart(2, '0')}`
      : horaAgendamento;

    const data = new Date(`${dataAgendamento}T${horaParaUsar}`);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataZerada = new Date(
      data.getFullYear(),
      data.getMonth(),
      data.getDate()
    );

    const diffDias = Math.floor(
      (dataZerada.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
    );

    const diasSemana = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

    if (diffDias === 0)
      return horaInvalida ? `hoje` : `hoje às ${horaParaUsar}`;
    if (diffDias === 1)
      return horaInvalida ? `amanhã` : `amanhã às ${horaParaUsar}`;
    if (diffDias > 1 && diffDias <= 7) {
      const diaSemana = diasSemana[data.getDay()];
      return horaInvalida ? `${diaSemana}` : `${diaSemana} às ${horaParaUsar}`;
    }

    const dia = data.getDate().toString().padStart(2, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const ano = data.getFullYear();

    return horaInvalida
      ? `${dia}/${mes}/${ano}`
      : `${dia}/${mes}/${ano} às ${horaParaUsar}`;
  }

  return (
    <div className={styles.grid}>
      {favoritos?.map((fav) => (
        <div key={fav.id_usuario} className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.avatar}>
              <span>{fav.nome.charAt(0).toUpperCase()}</span>
            </div>
          </div>

          <div className={styles.cardBody}>
            <h3 className={styles.cardTitle}>
              {fav.nome.split(' ')[0]}{' '}
              {fav.nome.split(' ').length > 1 &&
                fav.nome.split(' ')[fav.nome.split(' ').length - 1]}{' '}
              <span>{fav.disponibilidade}</span>
            </h3>
            <p className={styles.cardId}>{fav.especialidade}</p>
          </div>
          <span>
            {(dataAgendamento || horaAgendamento) &&
              agendar.status &&
              agendar.id === fav.id_usuario &&
              formatarDataAgendamento(dataAgendamento, horaAgendamento)}
          </span>
          <div className={styles.cardActions}>
            {agendar.status && agendar.id === fav.id_usuario && (
              <div className={styles.agendarInputs}>
                <div className={styles.calendar_input}>
                  <BiCalendar size={30} />
                  <input
                    type='date'
                    min={new Date().toISOString().split('T')[0]}
                    value={dataAgendamento}
                    onChange={(e) => setDataAgendamento(e.target.value)}
                  />
                </div>
                <div
                  style={{ animationTimeline: '1s' }}
                  className={styles.time_input}
                >
                  <BiTime size={30} />
                  <input
                    type='time'
                    value={horaAgendamento}
                    onChange={(e) => setHoraAgendamento(e.target.value)}
                  />
                </div>
              </div>
            )}

            <Button
              style={{
                border: '1px solid #00000010',
                boxShadow: 'var(--shadow-sm',
              }}
              color='purple'
              size={5}
              disabled={
                agendar.status && agendar.id === fav.id_usuario && loading
              }
              onClick={() => {
                if (agendar.status && agendar.id === fav.id_usuario) {
                  handleAgendar(fav.id_usuario);
                } else {
                  setDataAgendamento('');
                  setHoraAgendamento('');
                  setAgendar({ status: true, id: fav.id_usuario });
                }
              }}
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
              <span>
                {agendar.status && agendar.id === fav.id_usuario
                  ? 'Confirmar'
                  : 'Agendar'}
              </span>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
