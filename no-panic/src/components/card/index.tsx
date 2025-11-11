'use client';
import React, { useState } from 'react';
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
  favoritos: Terapeuta[];
  onFavoritar: () => void;
};

export const Card = ({ terapeuta, favoritos, onFavoritar }: Prop) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const favoritarTerapeuta = async () => {
    if (!user) return toast.error('Usuário não logado');
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/favoritar`,
        {
          id_usuario: user.id,
          id_terapeuta: terapeuta.id_usuario,
        }
      );
      if (res.status === 201) {
        toast.success('Favoritado');
        onFavoritar();
      } else {
        toast.error('Erro ao favoritar');
      }
    } catch (err) {
      toast.error('Erro ao favoritar');
    } finally {
      setLoading(false);
    }
  };

  const jaFavoritado = favoritos.some(
    (f) => f.id_usuario === terapeuta.id_usuario
  );

  return (
    <div className={styles.card}>
      <div className={styles.info}>
        <span className={styles.avatar}>{terapeuta.nome[0]}</span>
        <div>
          <h4>
            {terapeuta.nome.split(' ')[0]}{' '}
            {terapeuta.nome.split(' ').length > 1 &&
              terapeuta.nome.split(' ')[terapeuta.nome.split(' ').length - 1]}
          </h4>
          <p title='CRP do profissional'>{terapeuta.CRP}</p>
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
      {jaFavoritado ? (
        <Button
          onClick={() => toast.info('Já favoritado')}
          style={{ cursor: 'not-allowed', paddingBlock: '.5rem' }}
        >
          <BiCheck />
        </Button>
      ) : (
        <Button
          disabled={loading}
          onClick={favoritarTerapeuta}
          style={{ paddingBlock: '.5rem' }}
        >
          Favoritar
        </Button>
      )}
    </div>
  );
};
