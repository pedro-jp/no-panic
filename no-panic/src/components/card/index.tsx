'use client';

import React, { useEffect, useState } from 'react';
import styles from './styles.module.css';
import { FiClock } from 'react-icons/fi';
import { IoStar } from 'react-icons/io5';
import { Button } from '../ui/button';
import { Terapeuta } from '@/app/terapeutas/page';
import axios from 'axios';
import { useAuth } from '@/context/auth-context';
import { BiCheck } from 'react-icons/bi';
import { toast } from 'react-toastify';

type Prop = {
  terapeuta: Terapeuta;
};

export const Card = ({ terapeuta }: Prop) => {
  const [favoritos, setFavoritos] = useState<Terapeuta[]>();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    getFavoritos();
  }, [user]);

  const getFavoritos = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/usuarios/${user?.id}/terapeutas`
      );
      setFavoritos(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const favoritarTerapeuta = async (
    id_usuario: number | undefined,
    id_terapeuta: number | undefined
  ) => {
    if (!id_usuario || !id_terapeuta)
      return toast.error('Selecione um terapeuta');
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/favoritar`,
        {
          id_usuario,
          id_terapeuta,
        }
      );
      if (res.status === 201) {
        toast.success('Favoritado');
        setFavoritos((prevFavoritos) => [...(prevFavoritos ?? []), terapeuta]);
      }
      if (res.status === 400) {
        toast.success('Erro ao favoritar');
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.info}>
        <span className={styles.avatar}>{terapeuta.nome[0]}</span>
        <div>
          <h4>
            {terapeuta.nome.split(' ')[0]}{' '}
            {terapeuta.nome.split(' ')[terapeuta.nome.split(' ').length - 1]}
          </h4>
          <p title='CRP do profissional'>{terapeuta.CRP} </p>
        </div>
      </div>
      <div className={styles.info}>
        <p className={styles.especialidade}>{terapeuta.especialidade}</p>
        <p className={styles.dia_atendimento}>
          <FiClock />
          {terapeuta.disponibilidade}
        </p>
        <p className={styles.nota}>
          <span>
            <IoStar color='#efb810' />
            4.7
          </span>
          <span>120 sessões</span>
        </p>
      </div>
      {favoritos &&
      favoritos.some(
        (favorito) => favorito.id_usuario === terapeuta.id_usuario
      ) ? (
        <Button
          disabled={loading}
          onClick={() => {
            toast.warn('Já favoritado');
          }}
          style={{ cursor: 'not-allowed', paddingBlock: '.5rem' }}
        >
          <BiCheck />
        </Button>
      ) : (
        <Button
          disabled={loading}
          onClick={() => favoritarTerapeuta(user?.id, terapeuta?.id_usuario)}
          style={{ paddingBlock: '.5rem' }}
        >
          Favoritar
        </Button>
      )}
    </div>
  );
};
