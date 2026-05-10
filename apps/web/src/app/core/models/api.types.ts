// Domain interfaces matching the database schema

export interface Process {
  id: string;
  clientId: string;
  cnjNumber: string;
  comarca: string;
  vara: string;
  courtType: 'vara' | 'jec';
  authorName: string;
  defendantName: string;
  clientSide: 'reu' | 'autor';
  status: 'citado' | 'em_andamento' | 'encerrado';
  citationDate: string | null;
  mentionsWitness: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: 'pf' | 'pj';
  createdAt: string;
}

export interface Hearing {
  id: string;
  processId: string;
  dateTime: string;
  type: 'conciliacao' | 'aij' | 'oitiva' | 'acij';
  status: 'agendada' | 'realizada' | 'cancelada' | 'redesignada';
  rescheduledTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Witness {
  id: string;
  processId: string;
  replacedById: string | null;
  fullName: string;
  address: string | null;
  residenceComarca: string | null;
  maritalStatus: string | null;
  profession: string | null;
  phone: string | null;
  notes: string | null;
  side: 'reu' | 'autor';
  status:
    | 'pendente_dados'
    | 'dados_completos'
    | 'rol_juntado'
    | 'intimada'
    | 'intimacao_positiva'
    | 'intimacao_negativa'
    | 'aguardando_cliente'
    | 'desistida'
    | 'substituida';
  replaced: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Deadline {
  id: string;
  processId: string;
  witnessId: string | null;
  type:
    | 'dados_testemunha'
    | 'custas_precatoria'
    | 'juntada_intimacao'
    | 'desistencia_testemunha'
    | 'providencia_cliente';
  dueDate: string;
  status: 'aberto' | 'cumprido' | 'vencido' | 'cancelado';
  notificationSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  profile: 'superadmin' | 'advogado' | 'paralegal';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  processId: string | null;
  userId: string | null;
  createdAt: string;
  actionType: string;
  description: string | null;
  previousData: unknown;
  newData: unknown;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
  };
}

// Label maps for display

export const PROCESS_STATUS_LABELS: Record<Process['status'], string> = {
  citado: 'Citado',
  em_andamento: 'Em Andamento',
  encerrado: 'Encerrado',
};

export const COURT_TYPE_LABELS: Record<Process['courtType'], string> = {
  vara: 'Vara Comum',
  jec: 'JEC',
};

export const CLIENT_SIDE_LABELS: Record<Process['clientSide'], string> = {
  reu: 'Réu',
  autor: 'Autor',
};

export const WITNESS_STATUS_LABELS: Record<Witness['status'], string> = {
  pendente_dados: 'Pendente de Dados',
  dados_completos: 'Dados Completos',
  rol_juntado: 'Rol Juntado',
  intimada: 'Intimada',
  intimacao_positiva: 'Intimação Positiva',
  intimacao_negativa: 'Intimação Negativa',
  aguardando_cliente: 'Aguardando Cliente',
  desistida: 'Desistida',
  substituida: 'Substituída',
};

export const DEADLINE_TYPE_LABELS: Record<Deadline['type'], string> = {
  dados_testemunha: 'Dados da Testemunha',
  custas_precatoria: 'Custas Precatória',
  juntada_intimacao: 'Juntada de Intimação',
  desistencia_testemunha: 'Desistência de Testemunha',
  providencia_cliente: 'Providência do Cliente',
};

export const DEADLINE_STATUS_LABELS: Record<Deadline['status'], string> = {
  aberto: 'Aberto',
  cumprido: 'Cumprido',
  vencido: 'Vencido',
  cancelado: 'Cancelado',
};

export const HEARING_TYPE_LABELS: Record<Hearing['type'], string> = {
  conciliacao: 'Conciliação',
  aij: 'AIJ',
  oitiva: 'Oitiva',
  acij: 'ACIJ',
};

export const HEARING_STATUS_LABELS: Record<Hearing['status'], string> = {
  agendada: 'Agendada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  redesignada: 'Redesignada',
};

export const USER_PROFILE_LABELS: Record<User['profile'], string> = {
  superadmin: 'Superadmin',
  advogado: 'Advogado',
  paralegal: 'Paralegal',
};

export const CLIENT_TYPE_LABELS: Record<Client['type'], string> = {
  pf: 'Pessoa Física',
  pj: 'Pessoa Jurídica',
};

export const ACTION_TYPE_VALUES = [
  'CREATE_PROCESS',
  'UPDATE_PROCESS',
  'DELETE_PROCESS',
  'CREATE_HEARING',
  'UPDATE_HEARING',
  'CANCEL_HEARING',
  'RESCHEDULE_HEARING',
  'CREATE_WITNESS',
  'UPDATE_WITNESS',
  'REPLACE_WITNESS',
  'RETIRE_WITNESS',
  'CREATE_DEADLINE',
  'UPDATE_DEADLINE',
  'CANCEL_DEADLINE',
  'SEND_EMAIL',
  'ACK_EMAIL',
  'FULFILL_EMAIL',
  'CREATE_USER',
  'UPDATE_USER',
  'JOB_PRAZOS',
] as const;
