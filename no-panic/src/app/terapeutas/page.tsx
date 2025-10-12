import { Container } from '@/components/ui/container';
import { Content } from '@/components/ui/content';
import { Header } from '@/components/ui/header';
import React from 'react';

const page = () => {
  return (
    <>
      <Header />
      <Container>
        <Content>Terapeutas</Content>
      </Container>
    </>
  );
};

export default page;
