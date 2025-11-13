import { Status, Tipo } from '@/enums/enums';
import { UUID } from 'crypto';

export interface Sessao {
  id_sessao: number;
  id_usuario: number;
  nome: string;
  email: string;
  status?: Status;
  data_hora_agendamento: Date;
  data_hora_inicio?: Date;
  data_hora_fim?: Date;
  duracao?: number;
  tipo?: Tipo;
  uuid: UUID;
}

export type SessaoCompleta = {
  id_sessao: number;
  tipo: string;
  status: string;
  data_hora_agendamento: string | null;
  data_hora_inicio: string | null;
  data_hora_fim: string | null;
  duracao: number | null;
  criadoEm: string;
  atualizadoEm: string;
  usuario: {
    id: number;
    nome: string;
    email: string;
  };
  terapeuta: {
    id: number;
    nome: string;
    email: string;
  };
};
