import { Sessao } from '@/types/types';

export const getSessoes = async (
  tipo: string,
  id: number
): Promise<Sessao[]> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/sessoes/${tipo}/${id}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    throw new Error(`Erro ao buscar sessões: ${res.status}`);
  }

  const data = await res.json();
  return data as Sessao[];
};

export const formatarData = (dataInput: Date) => {
  const data = new Date(dataInput);
  const agora = new Date();

  const hora = data
    .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    .replace(':', 'h');

  const dataSemHora = new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate()
  );
  const hojeSemHora = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate()
  );

  const diffDias =
    (dataSemHora.getTime() - hojeSemHora.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDias === 0) return `Hoje - ${hora}`;
  if (diffDias === 1) return `Amanhã - ${hora}`;

  if (diffDias > 1 && diffDias <= 7) {
    const diaSemana = data
      .toLocaleDateString('pt-BR', { weekday: 'short' })
      .replace('.', '')
      .replace(/^./, (c) => c.toUpperCase());
    return `${diaSemana} - ${hora}`;
  }

  const dataFormatada = data.toLocaleDateString('pt-BR');
  return `${dataFormatada} - ${hora}`;
};
