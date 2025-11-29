'use client';

import React, { useEffect, useState } from 'react';
import styles from './styles.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { IoClose, IoHeart, IoMenu } from 'react-icons/io5';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { BiLogOut, BiUser, BiUserPlus } from 'react-icons/bi';
import { getCookie } from 'cookies-next';

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

const HeaderComponent = () => {
  const { user, logout } = useAuth();

  // URL do seu endpoint de envio de localização
  const API_URL = 'https://776370d2b564.ngrok-free.app/send-location';
  // Número de destino, você deve obter este número de alguma forma
  // Como é um SOS, pode ser um número de emergência ou de um terapeuta específico.
  const DESTINATION_NUMBER = '5511910613131'; // Substitua pelo número real

  const [sosStatus, setSosStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // 1. Função principal de Geolocation
  const getPreciseLocation = () => {
    return new Promise((resolve, reject) => {
      // Verifica se a API de geolocalização está disponível no navegador
      if (!navigator.geolocation) {
        return reject(
          new Error('A geolocalização não é suportada pelo seu navegador.')
        );
      }

      // Obtém a posição atual com alta precisão
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          // Trata erros como permissão negada (PERMISSION_DENIED)
          reject(
            new Error(
              `Erro ao obter localização (${error.code}): ${error.message}`
            )
          );
        },
        // Opções para alta precisão
        {
          enableHighAccuracy: true, // Solicita a melhor precisão possível
          timeout: 10000, // Tempo máximo de espera (10 segundos)
          maximumAge: 0, // Não aceita cache, força a leitura de uma nova posição
        }
      );
    });
  };

  // 2. Função de Envio
  const handleSOSClick = async () => {
    if (isSending) return; // Impede múltiplos cliques

    if (!user) {
      setSosStatus('Erro: Você precisa estar logado para enviar SOS.');
      return;
    }

    setIsSending(true);
    setSosStatus('Obtendo localização...');

    try {
      const location = (await getPreciseLocation()) as Location;

      setSosStatus('Localização obtida! Enviando para o WhatsApp...');

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: DESTINATION_NUMBER,
          latitude: `${location.latitude}00`,
          longitude: `${location.longitude}00`,
          description: `🆘 SOS de ${user.nome || user.email}!
Latitude: ${location.latitude}, Longitude: ${location.longitude}.
Precisão: ${location.accuracy} metros.
Por favor, verifique imediatamente.`,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSosStatus('✅ SOS enviado com sucesso! Ajuda a caminho.');
      } else {
        setSosStatus(
          `❌ Erro ao enviar SOS: ${data.error || 'Erro desconhecido na API.'}`
        );
      }
    } catch (error: any) {
      console.error('Erro no processo SOS:', error);
      setSosStatus(`❌ Falha crítica: ${error.message}`);
    } finally {
      setIsSending(false);
      // Limpa a mensagem de status após alguns segundos
      setTimeout(() => setSosStatus(null), 10000);
    }
  };
  return (
    <header className={styles.header}>
      <menu>
        <div className={styles.burger}>
          <input type='checkbox' name='burger' id='burger' />
          <IoMenu className={styles.closed} />
          <IoClose className={styles.open} />
        </div>

        <Link href='/' className={styles.logo}>
          <Image src='/logo_azul_sf.png' alt='logo' height={30} width={30} />
          <h4>No Panic</h4>
        </Link>

        <ul>
          <li>
            <Link href='/terapeutas'>Terapeutas</Link>
          </li>
          {user?.terapeuta?.CRP ? (
            <li>
              <Link href='/pacientes'>Pacientes</Link>
            </li>
          ) : (
            <li>
              <Link href='/favoritos'>Favoritos</Link>
            </li>
          )}
          <li>
            <Link href='/sessoes'>Sessões</Link>
          </li>
          <li>
            <Link href='/chats'>Chats</Link>
          </li>
        </ul>

        <div className={styles.sos_perfil}>
          <button
            className={styles.sos_btn}
            onClick={handleSOSClick} // Adicionando o manipulador de clique
            disabled={isSending || !user} // Desabilita se estiver enviando ou não logado
          >
            <IoHeart color='red' />
            {isSending ? 'ENVIANDO...' : 'SOS'}
          </button>

          {/* Exibe o status de envio */}
          {sosStatus && <p className={styles.sos_status}>{sosStatus}</p>}

          {user && (
            <div className={styles.config}>
              <Image src='/logo.png' alt='Perfil' width={20} height={20} />
              <ul className={styles.content}>
                <li>
                  <Link href='/perfil'>
                    <button>
                      <BiUser /> Perfil
                    </button>
                  </Link>
                </li>

                {!user?.terapeuta?.CRP && (
                  <li>
                    <Link href={`/cadastro-terapeuta-psicologo/${user?.id}`}>
                      <button>
                        <BiUserPlus /> Terapeuta/Psicólogo
                      </button>
                    </Link>
                  </li>
                )}

                <li>
                  <button className={styles.sair} onClick={logout}>
                    <BiLogOut /> Sair
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </menu>

      <nav>
        <ul className={styles.ul_mobile}>
          <li>
            <Link href='/terapeutas'>Terapeutas</Link>
          </li>
          {user?.terapeuta?.CRP ? (
            <li>
              <Link href='/pacientes'>Pacientes</Link>
            </li>
          ) : (
            <li>
              <Link href='/favoritos'>Favoritos</Link>
            </li>
          )}
          <li>
            <Link href='/sessoes'>Sessões</Link>
          </li>
          <li>
            <Link href='/chats'>Chats</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

function Header() {
  return (
    <AuthProvider>
      <HeaderComponent />
    </AuthProvider>
  );
}

export default React.memo(Header);
