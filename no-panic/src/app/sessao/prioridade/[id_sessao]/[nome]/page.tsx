import { SessaoCompleta } from '@/types/types';
import React from 'react';
import { VideoCall } from '../../../../../components/chamada/chamada';

interface PageProps {
  id_sessao: string;
  nome: string;
  id_usuario: string;
}

const fetchSessao = async (id_sessao: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/sessao/${id_sessao}`,
      { cache: 'no-store' }
    );

    if (!response.ok) throw new Error('Erro ao buscar sessão');

    const data = await response.json();
    return data as SessaoCompleta;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const normalizar = (str: string) =>
  str.trim().toLowerCase().replace(/\s+/g, ' ');

const identificarPapel = (sessao: SessaoCompleta, nome: string) => {
  const nomeNormalizado = normalizar(nome);
  const nomeUsuario = normalizar(sessao.usuario.nome);
  const nomeTerapeuta = normalizar(sessao.terapeuta.nome);

  if (nomeNormalizado === nomeUsuario) return 'usuario';
  if (nomeNormalizado === nomeTerapeuta) return 'terapeuta';
  return 'desconhecido';
};

const Page = async ({ params }: { params: PageProps }) => {
  const { id_sessao, nome } = params;
  const nomeDecodificado = decodeURIComponent(nome);
  const sessao = await fetchSessao(id_sessao);

  if (!sessao) return <div>Erro ao carregar sessão.</div>;

  const papel = identificarPapel(sessao, nomeDecodificado);

  const me =
    papel === 'usuario'
      ? sessao.usuario
      : papel === 'terapeuta'
      ? sessao.terapeuta
      : null;

  const outro =
    papel === 'usuario'
      ? sessao.terapeuta
      : papel === 'terapeuta'
      ? sessao.usuario
      : null;

  if (!me || !outro) return <div>Usuário não reconhecido na sessão.</div>;

  return <VideoCall sessao={sessao} me={me} outro={outro} />;
};

export default Page;
