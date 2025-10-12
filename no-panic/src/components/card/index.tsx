import React from 'react';
import styles from './styles.module.css';
import Image from 'next/image';
import { FiClock } from 'react-icons/fi';
import { IoStar } from 'react-icons/io5';

export const Card = () => {
  return (
    <div className={styles.card}>
      <Image
        src='/profile.jpg'
        alt='Foto de perfil do terapeuta'
        height={60}
        width={60}
      />

      <div className={styles.info}>
        <h4>Nome do terapeuta</h4>
        <p>Crp do terapeuta </p>
      </div>
      <div className={styles.info}>
        <p className={styles.especialidade}>Especialidade do terapeuta</p>
        <p className={styles.dia_atendimento}>
          <FiClock />
          Qua-Dom 11h-20h
        </p>
        <p className={styles.nota}>
          <span>
            <IoStar color='#efb810' />
            4.7
          </span>
          <span>120 sessões</span>
        </p>
      </div>
    </div>
  );
};
