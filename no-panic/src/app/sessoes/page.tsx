'use client';

import { Container } from '@/components/ui/container';
import { Content } from '@/components/ui/content';
import { Header } from '@/components/ui/header';
import styles from './styles.module.css';
import React, { useEffect } from 'react';
import { getSessoes } from '@/utils';

const Page = () => {
  useEffect(() => {
    getSessoes('usuario', 2);
  }, []);
  return (
    <>
      <Header />
      <Container>
        <Content>
          <main>
            <div className={styles.calendario}>sessoes</div>
          </main>
        </Content>
      </Container>
    </>
  );
};

export default Page;
