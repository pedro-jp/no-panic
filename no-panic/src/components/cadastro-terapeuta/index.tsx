'use client';

import axios from 'axios';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { Input } from '../ui/input-com-label';
import { Button } from '../ui/button';
import styles from './styles.module.css';

interface PageProps {
  id: number;
}

const TerapeutaForm = ({ id }: PageProps) => {
  const [loading, setLoading] = useState(false);
  const [especialidade, setEspecialidade] = useState('');
  const [crp, setCrp] = useState('');
  const [disponibilidade, setDisponibilidade] = useState('');
  const [senha, setSenha] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/cadastro-terapeuta`,
        {
          id,
          especialidade,
          crp,
          disponibilidade,
        }
      );
      if (response.status === 201) toast.success('Profissional cadastrado');
      window.location.href = '/';
    } catch (error) {
      console.log(error);
      toast.info('Cadastre novamente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <form className={styles.form} action='submit' onSubmit={handleSubmit}>
        <div>
          <Input
            onChange={(e) => setEspecialidade(e.target.value)}
            label='Especialidade'
            value={especialidade}
          />
          <Input
            onChange={(e) => setDisponibilidade(e.target.value)}
            label='Disponibilidade'
            value={disponibilidade}
          />
        </div>
        <div>
          <Input
            onChange={(e) => setCrp(e.target.value)}
            label='CRP'
            value={crp}
          />

          <Input
            onChange={(e) => setSenha(e.target.value)}
            label='Senha'
            value={senha}
          />
        </div>

        <Button type='submit' disabled={loading}>
          Cadastrar profissional
        </Button>
      </form>
    </main>
  );
};

export default TerapeutaForm;
