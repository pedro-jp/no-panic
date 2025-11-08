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
