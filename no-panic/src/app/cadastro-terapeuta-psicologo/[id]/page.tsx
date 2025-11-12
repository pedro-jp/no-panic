import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Content } from '@/components/ui/content';
import { Header } from '@/components/ui/header';
import { Input } from '@/components/ui/input-com-label';
import { AuthProvider, useAuth, User } from '@/context/auth-context';
// import React, { useState } from 'react';

import styles from './styles.module.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { redirect } from 'next/navigation';
import TerapeutaForm from '@/components/cadastro-terapeuta';

//Fazer fetch no user e usar server component para a renderização da página

async function hasCrp(id: number) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/has-terapeuta`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token_aqui',
        },
        body: JSON.stringify({
          id: id,
        }),
      }
    );

    const res = await response.json();

    return res;
  } catch (error) {}
}

interface Params {
  id: number;
}

const Page = async ({ params }: { params: Params }) => {
  const { id } = await params;

  const { CRP } = await hasCrp(id);

  return (
    <>
      <head>
        <title>Terapeuta | Psicólogo</title>
      </head>
      <Header />
      <Container>
        {CRP && <h2>Terapeuta já cadastrado</h2>}
        <Content>{!CRP && <TerapeutaForm id={id} />}</Content>
      </Container>
    </>
  );
};

export default Page;
