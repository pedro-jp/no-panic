import React from 'react';
import styles from './styles.module.css';
import Image from 'next/image';
import { FiClock } from 'react-icons/fi';
import { IoStar } from 'react-icons/io5';
import { Button } from '../ui/button';
import { Terapeuta } from '@/app/terapeutas/page';

type Prop = {
  terapeuta: Terapeuta;
};

export const Card = ({ terapeuta }: Prop) => {
  return (
    <div className={styles.card}>
      <Image
        src='/profile.jpg'
        alt='Foto de perfil do terapeuta'
        height={60}
        width={60}
      />

      <div className={styles.info}>
        <h4>{terapeuta.nome}</h4>
        <p>{terapeuta.CRP} </p>
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
      <Button style={{ paddingBlock: '.5rem' }}>Agendar Sessão</Button>
    </div>
  );
};
