'use client';
import React, { useEffect, useState } from 'react';
import { Modal } from '../modal/Modal';
import styles from './styles.module.css';
import { Button } from '../ui/button';
import { Input } from '../ui/input-com-label';

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

export const PrimeiroLoginForm = () => {
  const [loading, setLoading] = useState(false);
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState<Address | null>(null);
  const [complemento, setComplemento] = useState<string>();
  const [numero, setNumero] = useState<string>();

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
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  return (
    <Modal canExit={false}>
      <div className={styles.container}>
        <form onSubmit={handleSubmit}>
          <Input label='Data de nascimento' type='date' required />
          <Input
            label='Cep da residência'
            type='text'
            required
            maxLength={8}
            minLength={8}
            onChange={(e) => setCep(e.target.value)}
          />
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
          <Input label='Whatsapp contato de emergência' type='text' />
          <Button disabled={loading} type='submit'>
            Concluir
          </Button>
        </form>
      </div>
    </Modal>
  );
};
