import { Container } from '@/components/ui/container';
import { Content } from '@/components/ui/content';
import { Header } from '@/components/ui/header';
import styles from './styles.module.css';
import React from 'react';

const Page = () => {
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
