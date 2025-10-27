'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '../modal/Modal';
import styles from './styles.module.css';
import { Button } from '../ui/button';
import { Input } from '../ui/input-com-label';
import { User } from '@/app/layout';
import { setCookie } from 'cookies-next';

interface Address {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  complemento?: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
}

interface PrimeiroLoginFormProps {
  user: User;
  // other props...
}

export async function buscarCep(cep: string): Promise<Address | null> {
  try {
    // Remove qualquer caractere que não seja número
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      throw new Error('CEP inválido');
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);

    if (!response.ok) {
      throw new Error('Erro ao buscar o CEP');
    }

    const data = (await response.json()) as Address & { erro?: boolean };

    if (data.erro) return null;

    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export const PrimeiroLoginForm = ({ user }: PrimeiroLoginFormProps) => {
  const [loading, setLoading] = useState(false);
  const [cep, setCep] = useState('');
  const [cepText, setCepText] = useState('');
  const [endereco, setEndereco] = useState<Address | null>(null);
  const [complemento, setComplemento] = useState<string>();
  const [numero, setNumero] = useState<string>();
  const [contato_emergencia, setContato_emergencia] = useState(''); // número puro
  const [telefoneFormatado, setTelefoneFormatado] = useState(''); // string formatada
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const anoMinimo = anoAtual - 18; // 18 anos atrás

  const [data_nascimento, setData_nascimento] = useState(
    new Date().toISOString().split('T')[0]
  );
  useEffect(() => {
    if (cep.length === 8) {
      console.log(cep);

      const fetchEndereco = async () => {
        const address = await buscarCep(cep);

        if (address) {
          setEndereco(address);
        } else {
          console.log('CEP não encontrado');
        }
      };

      fetchEndereco();
    }
  }, [cep]);

  useEffect(() => {
    console.log(endereco);
  }, [endereco]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    if (!user?.id) return;
    const data = {
      id: user.id,
      endereco: endereco?.logradouro,
      contato_emergencia: contato_emergencia,
      data_nascimento: data_nascimento,
    };
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/cadastro-usuario`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (response.status === 201) {
        const id = { id: user.id };
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/primeiro-login`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(id),
          }
        );
        load();
        window.location.href = '/terapeutas';
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const load = async () => {
    if (!user?.email) return;

    const data = {
      email: user.email,
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/load-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Erro ao entrar');
      }
      const { usuario } = await response.json();
      setCookie('user', JSON.stringify(usuario), { maxAge: 60 * 60 * 24 * 7 }); // 7 dias
    } catch (err) {
      console.error(err);
    }
  };

  function formatarCEP(valor: string) {
    const apenasNumeros = valor.replace(/\D/g, '').slice(0, 8); // só números, máximo 8
    const cepFormatado =
      apenasNumeros.length > 5
        ? apenasNumeros.replace(/^(\d{5})(\d{1,3})/, '$1-$2')
        : apenasNumeros;

    setCep(apenasNumeros);
    setCepText(cepFormatado);
  }

  function formatarTelefone(valor: string) {
    const apenasNumeros = valor.replace(/\D/g, '').slice(0, 11); // DDD + 9 dígitos
    setContato_emergencia(apenasNumeros);

    let telefone = apenasNumeros;

    if (apenasNumeros.length > 2) {
      telefone = `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;
    }

    if (apenasNumeros.length > 7) {
      telefone = `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(
        2,
        7
      )}-${apenasNumeros.slice(7)}`;
    }

    setTelefoneFormatado(telefone);
  }

  return (
    <Modal canExit={false}>
      <div className={styles.container}>
        <form onSubmit={handleSubmit}>
          <div className={styles.line}>
            <Input
              label='Data de nascimento'
              type='date'
              value={data_nascimento}
              min='1915-01-01'
              max={`${anoMinimo}-${String(hoje.getMonth() + 1).padStart(
                2,
                '0'
              )}-${String(hoje.getDate()).padStart(2, '0')}`}
              onChange={(e) => setData_nascimento(e.target.value)}
              required
            />
            <Input
              className={styles.cep}
              label='Cep da residência'
              value={cepText}
              type='text'
              required
              maxLength={9}
              minLength={9}
              onChange={(e) => formatarCEP(e.target.value)}
              placeholder='00000-000'
            />
            <Input
              label='Whatsapp contato de emergência'
              value={telefoneFormatado}
              type='text'
              onChange={(e) => formatarTelefone(e.target.value)}
            />
          </div>
          {endereco && (
            <Input
              label='Endereço'
              value={
                endereco
                  ? `${endereco.logradouro}${numero ? `, N° ${numero}` : ''}, ${
                      endereco.bairro
                    } - ${endereco.localidade} / ${endereco.uf} - CEP: ${
                      endereco.cep
                    }${complemento ? `, Complemento: ${complemento}` : ''}`
                  : ''
              }
            />
          )}

          {cep && (
            <>
              <Input
                label='Número da residência'
                type='text'
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                required
              />
              <Input
                label='Complemento'
                type='text'
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
              />
            </>
          )}
          <Button disabled={loading} type='submit'>
            Concluir
          </Button>
        </form>
      </div>
    </Modal>
  );
};
