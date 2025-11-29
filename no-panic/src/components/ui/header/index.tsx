'use client';

import React, { useEffect, useState, useRef } from 'react';
import styles from './styles.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { IoClose, IoHeart, IoMenu } from 'react-icons/io5';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { BiLogOut, BiUser, BiUserPlus } from 'react-icons/bi';
import { toast } from 'react-toastify';
import axios from 'axios';
import { redirect, useRouter } from 'next/navigation';

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface TerapeutaInfo {
  id_usuario: number;
  nome: string;
  email: string;
  especialidade: string | null; // Pode ser NULL se o usuário não for terapeuta
  disponibilidade: string | null;
  CRP: string | null;
}

const HOLD_TIME_MS = 3000;

const UPDATE_INTERVAL_MS = 100;

const HeaderComponent = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_WPP_API;
  const DESTINATION_NUMBER =
    user?.contato_emergencia.length === 11
      ? `55${user?.contato_emergencia}`
      : user?.contato_emergencia;

  const [sosStatus, setSosStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [terapeuta, setTerapeuta] = useState<TerapeutaInfo>();
  const [sessao, setSessao] = useState();

  useEffect(() => {
    fetchTerapeuta();
  }, [user]);

  const fetchTerapeuta = async () => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/terapeuta/${user?.terapeuta_fav}`
    );
    setTerapeuta(res.data);
  };

  function formatarDataAtual() {
    const now = new Date();

    // Funções auxiliares para garantir dois dígitos (ex: 5 -> 05)
    const pad = (num: number) => String(num).padStart(2, '0');

    // Componentes de Data
    const ano = now.getFullYear();
    const mes = pad(now.getMonth() + 1); // getMonth() retorna 0-11, então adicionamos 1
    const dia = pad(now.getDate());

    // Componentes de Hora
    const hora = pad(now.getHours());
    const minuto = pad(now.getMinutes());
    const segundo = pad(now.getSeconds());

    // Constrói a string final
    return `${ano}-${mes}-${dia} ${hora}:${minuto}:${segundo}`;
  }

  const horaFormatada = formatarDataAtual();

  const handleAgendar = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/sessao`,
        {
          id_usuario: user?.id,
          id_terapeuta: user?.terapeuta_fav,
          data_hora_agendamento: horaFormatada,
        }
      );
      setSessao(response.data.uuid);
      return response.data.uuid;
    } catch (e) {
      console.error(e);
    } finally {
    }
  };

  const getPreciseLocation = () => {
    return new Promise<Location>((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(
          new Error('A geolocalização não é suportada pelo seu navegador.')
        );
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error: GeolocationPositionError) => {
          reject(
            new Error(
              `Erro ao obter localização (${error.code}): ${error.message}`
            )
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        }
      );
    });
  };

  const getAddressFromCoords = async (
    lat: number,
    lon: number
  ): Promise<string> => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=pt-BR`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'NoPanicApp/1.0 (seu_email@exemplo.com)',
        },
      });
      const data = await response.json();

      if (data && data.address) {
        const address = data.address;
        const numero = address.house_number || '';
        const rua =
          address.road || address.pedestrian || address.street_name || '';
        const cidade =
          address.city ||
          address.town ||
          address.village ||
          address.county ||
          '';
        const estado = address.state || '';

        let formattedAddress = '';

        if (rua || cidade) {
          formattedAddress += `${numero} ${rua}`.trim();

          if (cidade) {
            formattedAddress += `, ${cidade}`;
          }
          if (estado) {
            formattedAddress += ` (${estado})`;
          }

          return formattedAddress;
        }
        return data.display_name;
      }
      return `[Endereço não identificado (Coordenadas: ${lat}, ${lon})]`;
    } catch (e) {
      console.error('Falha na Geocodificação Reversa (Nominatim):', e);
      return '[ERRO ao buscar endereço: Problema de rede]';
    }
  };

  const sendSOSAction = async () => {
    if (!user || isSending) return;

    setIsSending(true);
    setSosStatus('Obtendo localização...');

    let currentSOSLocation: Location;
    let fullAddress: string = '';

    try {
      currentSOSLocation = await getPreciseLocation();
      setSosStatus('Localização obtida. Buscando endereço...');
      console.log(currentSOSLocation);

      fullAddress = await getAddressFromCoords(
        currentSOSLocation.latitude,
        currentSOSLocation.longitude
      );

      const finalDescricao =
        `🆘 Pedido de Suporte Imediato! 🆘\n\n*${
          user.nome || user.email
        }* acionou o *SOS* e precisa de *ajuda* agora. \n\n` +
        `Localização:\n\`Lat: ${currentSOSLocation.latitude}, Lon: ${currentSOSLocation.longitude}\`\n\n` +
        `Endereço (Aprox.): \`${fullAddress}\`\n\n` +
        `*Você é o contato de emergência.* Por favor, entre em contato *imediatamente e preste o suporte necessário.*`;
      const id = await handleAgendar();
      const nomeCodificado = terapeuta?.nome
        ? encodeURIComponent(terapeuta.nome)
        : '';
      const terapeutaDescricao =
        `🆘 Pedido de Suporte Imediato! 🆘\n\n*${
          user.nome || user.email
        }* acionou o *SOS* e precisa de *ajuda* agora. \n\n` +
        `Localização:\n\`Lat: ${currentSOSLocation.latitude}, Lon: ${currentSOSLocation.longitude}\`\n\n` +
        `Endereço (Aprox.): \`${fullAddress}\`\n\n` +
        `*Você é o terapeuta de emergência.* Por favor, entre em contato *imediatamente e preste o suporte necessário.*\n\nhttps://no-panic-fecaf.vercel.app/sessao/prioridade/${id}/${nomeCodificado}`;

      setSosStatus('Endereço obtido. Enviando SOS para o WhatsApp...');

      const response = await fetch(API_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: DESTINATION_NUMBER,
          latitude: `${currentSOSLocation.latitude}00`,
          longitude: `${currentSOSLocation.longitude}00`,
          description: finalDescricao,
        }),
      });
      const terapeutaResponse = await fetch(API_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: DESTINATION_NUMBER,
          latitude: `${currentSOSLocation.latitude}00`,
          longitude: `${currentSOSLocation.longitude}00`,
          description: terapeutaDescricao,
        }),
      });

      const data = await response.json();
      const nomeUCodificado = user?.nome ? encodeURIComponent(user.nome) : '';
      if (response.ok) {
        setSosStatus('✅ SOS enviado com sucesso! Ajuda a caminho.');
        toast.success('SOS enviado, inspire e respire lentamente.');
        router.push(`sessao/prioridade/${id}/${nomeUCodificado}`);
      } else {
        toast.error('erro ao enviar', data.error);
        setSosStatus(
          `❌ Erro ao enviar SOS: ${data.error || 'Erro desconhecido na API.'}`
        );
      }
    } catch (error: any) {
      console.error('Erro no processo SOS:', error);
      setSosStatus(`❌ Falha crítica: ${error.message}`);
    } finally {
      setIsSending(false);
      setTimeout(() => setSosStatus(null), 10000);
    }
  };

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable && e.type !== 'touchstart') {
      e.preventDefault();
    }

    if (isSending || !user) return;

    setIsHolding(true);
    setProgress(0);
    setSosStatus('⚠️ Mantenha pressionado por 3s para enviar SOS...');

    let startTime = Date.now();

    holdTimeoutRef.current = setTimeout(() => {
      cancelHold(false);
      sendSOSAction();
    }, HOLD_TIME_MS);

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const calculatedProgress = Math.min(100, (elapsed / HOLD_TIME_MS) * 100);
      setProgress(calculatedProgress);

      if (calculatedProgress >= 100) {
        clearInterval(intervalRef.current!);
      }
    }, UPDATE_INTERVAL_MS);
  };

  const cancelHold = (resetStatus: boolean = true) => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsHolding(false);
    setProgress(0);
    if (resetStatus) {
      setSosStatus(null);
    }
  };

  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    startHold(e);
  };

  const handlePressEnd = () => {
    cancelHold();
  };

  const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

  return (
    <header className={styles.header}>
      <menu>
        {/* === ESTRUTURA ORIGINAL DE NAVEGAÇÃO DESKTOP/MOBILE === */}
        <div className={styles.burger}>
          <input type='checkbox' name='burger' id='burger' />
          <IoMenu className={styles.closed} />
          <IoClose className={styles.open} />
        </div>
        <Link href='/' className={styles.logo}>
          <Image src='/logo_azul_sf.png' alt='logo' height={30} width={30} />
          <h4>No Panic</h4>
        </Link>
        {/* 🚀 MENU PRINCIPAL (DESKTOP) */}
        <ul>
          {user && !user.terapeuta?.CRP && (
            <li>
              <Link href='/terapeutas'>Terapeutas</Link>
            </li>
          )}
          {user && user?.terapeuta?.CRP ? (
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
        {/* === FIM MENU PRINCIPAL === */}
        <div className={styles.sos_perfil}>
          {user && !user?.terapeuta?.CRP && (
            <div className={styles.sos_container}>
              <button
                className={styles.sos_btn}
                onMouseDown={handlePressStart}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onContextMenu={handleContextMenu}
                onTouchStart={handlePressStart}
                onTouchEnd={handlePressEnd}
                disabled={isSending || !user}
                style={{
                  transform: isHolding ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform 0.1s ease-out',
                  userSelect: 'none',
                }}
              >
                <IoHeart color='red' />
                {isSending
                  ? 'ENVIANDO...'
                  : isHolding
                  ? `SEGURANDO (${3 - Math.floor((progress * 3) / 100)}s)`
                  : 'SOS'}
              </button>

              {/* Barra de Progresso Visual */}
              {/* {isHolding && (
              <div
                className={styles.sos_progress_bar}
                style={{
                  width: `${progress}%`,
                  backgroundColor: 'red',
                  height: '5px',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  borderRadius: '0 0 4px 4px',
                  transition: 'none',
                }}
              />
            )} */}
            </div>
          )}

          {/* Exibe o status de envio */}
          {/* {sosStatus && <p className={styles.sos_status}>{sosStatus}</p>} */}

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

      {/* 🚀 MENU DE NAVEGAÇÃO MOBILE */}
      <nav>
        <ul className={styles.ul_mobile}>
          {user && !user.terapeuta?.CRP && (
            <li>
              <Link href='/terapeutas'>Terapeutas</Link>
            </li>
          )}
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
      {/* === FIM MENU MOBILE === */}
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
