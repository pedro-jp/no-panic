import { Status, Tipo } from '@/enums/enums';

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
}
