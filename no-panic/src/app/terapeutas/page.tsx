import { Container } from '@/components/ui/container';
import { Content } from '@/components/ui/content';
import { Header } from '@/components/ui/header';
import { Metadata } from 'next';
import React from 'react';
import styles from './styles.module.css';
import { Card } from '@/components/card';

export const metadata: Metadata = {
  title: 'Terapeutas | NoPanic',
};

const page = () => {
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
            />

            <div className={styles.card_container}>
              <Card />
              <Card />
              <Card />
              <Card />
              <Card />
            </div>
          </main>
        </Content>
      </Container>
    </>
  );
};

export default page;
