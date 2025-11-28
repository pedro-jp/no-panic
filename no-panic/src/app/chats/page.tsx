'use client';

import { Container } from '@/components/ui/container';
import { Content } from '@/components/ui/content';
import Header from '@/components/ui/header';
import { AuthProvider, useAuth } from '@/context/auth-context'; // Assumindo que você tem isso
import React, { useState, useEffect, useRef } from 'react';
import styles from './styles.module.css'; // Importa o CSS Module
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';

// --- Tipos ---
type Mensagem = {
  id?: number;
  from_id: number;
  id_remetente?: number;
  conteudo: string;
  message?: string;
  timestamp?: string;
  enviadoEm?: string;
};

interface MensagemLocal
  extends Pick<Mensagem, 'from_id' | 'conteudo' | 'timestamp'> {}

type Conversa = {
  id_conversa: number;
  outro_usuario_id: number;
  outro_usuario_nome: string;
};

// --- Componente do Chat ---
const ChatInterface = () => {
  const { user } = useAuth();
  // MOCK: ID do usuário logado (substitua pela lógica de autenticação real)
  const MEU_ID = user?.id;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [chatSelecionado, setChatSelecionado] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [param_id, setParam_id] = useState<string | null | undefined>(
    undefined
  );

  // Endpoint do seu backend FastAPI
  const API_BASE_URL = `${process.env.NEXT_PUBLIC_SERVER_URL}`;
  const API_BASE_SOCKET_URL = `${process.env.NEXT_PUBLIC_SOCKET_URL}`;

  const searchParams = useSearchParams();

  useEffect(() => {
    setParam_id(searchParams.get('u'));
  }, [searchParams]);

  useEffect(() => {
    if (!conversas) return;
    const conversa = conversas.find((a) => a.id_conversa === Number(param_id));
    setChatSelecionado(conversa!);
  }, [param_id, conversas]);
  // 1. Carregar lista de conversas ao iniciar
  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE_URL}/chat/conversas/${MEU_ID}`)
      .then((res) => res.json())
      .then((data) => setConversas(data))
      .catch((err) => console.error('Erro ao carregar conversas:', err));
  }, [MEU_ID, user]);

  // 2. Conectar ao WebSocket
  useEffect(() => {
    const ws = new WebSocket(`${API_BASE_SOCKET_URL}/ws/${MEU_ID}`);

    ws.onopen = () => {
      console.log('Conectado ao Chat WS');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      setMensagens((prev) => [
        ...prev,
        {
          from_id: data.from_id,
          conteudo: data.message,
          timestamp: data.timestamp,
        },
      ]);
    };

    ws.onclose = () => console.log('Desconectado do Chat WS');

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [MEU_ID]);

  // 3. Carregar histórico ao selecionar um chat
  useEffect(() => {
    setMensagens([]);
    if (chatSelecionado) {
      fetch(
        `${API_BASE_URL}/chat/historico/${MEU_ID}/${chatSelecionado.outro_usuario_id}`
      )
        .then((res) => res.json())
        .then((data) => {
          const msgsFormatadas = data.map((m: any) => ({
            from_id: m.id_remetente,
            conteudo: m.conteudo,
            timestamp: m.enviadoEm,
          }));
          setMensagens(msgsFormatadas);
        })
        .catch((err) => console.error('Erro ao carregar histórico:', err));
    }
  }, [chatSelecionado, MEU_ID]);

  // 4. Scroll automático para baixo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const enviarMensagem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !socket || !chatSelecionado) return;

    const payload = {
      target_id: chatSelecionado.outro_usuario_id,
      message: inputMsg,
    };
    socket.send(JSON.stringify(payload));

    // Adiciona otimistamente na UI
    setMensagens((prev) => [
      ...prev,
      {
        from_id: MEU_ID!,
        conteudo: inputMsg,
        timestamp: new Date().toISOString(),
      },
    ]);

    setInputMsg('');
  };

  return (
    <div className={styles.chatContainer}>
      {/* Sidebar - Lista de Conversas */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>Conversas</div>
        <ul>
          {conversas.length === 0 && (
            <p className={styles.conversationHint} style={{ padding: '1rem' }}>
              Nenhuma conversa iniciada.
            </p>
          )}
          {conversas.map((c) => (
            <li
              key={c.id_conversa}
              onClick={() => setChatSelecionado(c)}
              className={`${styles.conversationItem} ${
                chatSelecionado?.id_conversa === c.id_conversa
                  ? styles.conversationItemSelected
                  : ''
              }`}
            >
              <div className={styles.info}>
                <div className={styles.avatar}>
                  <span>{c.outro_usuario_nome.charAt(0).toUpperCase()}</span>
                </div>
                <div className={styles.conversationName}>
                  {c.outro_usuario_nome}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {/* Área do Chat */}
      <div className={styles.chatArea}>
        {chatSelecionado ? (
          <>
            {/* Header do Chat */}
            <div className={styles.chatHeader}>
              <span className={styles.chatTitle}>
                <div className={styles.avatar}>
                  <span>
                    {chatSelecionado.outro_usuario_nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                {chatSelecionado.outro_usuario_nome}
              </span>
              <span className={styles.onlineStatus}></span>
            </div>

            {/* Mensagens */}
            <div className={styles.messagesContainer}>
              {mensagens && mensagens.length < 1 && ''}
              {mensagens.map((msg, idx) => {
                const souEu = (msg.from_id || msg.id_remetente) === MEU_ID;
                const wrapperClass = souEu
                  ? styles.myMessageWrapper
                  : styles.theirMessageWrapper;
                const bubbleClass = souEu
                  ? styles.myMessageBubble
                  : styles.theirMessageBubble;
                const timeClass = souEu
                  ? styles.myMessageTime
                  : styles.theirMessageTime;

                return (
                  <div
                    key={idx}
                    className={`${styles.messageWrapper} ${wrapperClass}`}
                  >
                    <div className={`${styles.messageBubble} ${bubbleClass}`}>
                      <p>{msg.conteudo || msg.message}</p>
                      <span className={`${styles.messageTime} ${timeClass}`}>
                        {msg.timestamp
                          ? new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={enviarMensagem} className={styles.inputForm}>
              <input
                type='text'
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder='Digite sua mensagem...'
                className={styles.messageInput}
              />
              <button type='submit' className={styles.sendButton}>
                Enviar
              </button>
            </form>
          </>
        ) : (
          ''
        )}
      </div>
    </div>
  );
};

const Page = () => {
  return (
    <AuthProvider>
      <Header />
      <Container>
        <Content>
          <ChatInterface />
        </Content>
      </Container>
    </AuthProvider>
  );
};

export default Page;
