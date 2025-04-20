export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agendamentos: {
        Row: {
          bloqueado: boolean | null
          bloqueio_total: boolean | null
          cliente_id: string
          data: string
          data_criacao: string | null
          hora_fim: string
          id: string
          mensagem_confirmacao: string | null
          motivo_cancelamento: string | null
          observacoes: string | null
          preco: number
          servico_id: string
          status: Database["public"]["Enums"]["status_agendamento"]
        }
        Insert: {
          bloqueado?: boolean | null
          bloqueio_total?: boolean | null
          cliente_id: string
          data: string
          data_criacao?: string | null
          hora_fim: string
          id?: string
          mensagem_confirmacao?: string | null
          motivo_cancelamento?: string | null
          observacoes?: string | null
          preco: number
          servico_id: string
          status?: Database["public"]["Enums"]["status_agendamento"]
        }
        Update: {
          bloqueado?: boolean | null
          bloqueio_total?: boolean | null
          cliente_id?: string
          data?: string
          data_criacao?: string | null
          hora_fim?: string
          id?: string
          mensagem_confirmacao?: string | null
          motivo_cancelamento?: string | null
          observacoes?: string | null
          preco?: number
          servico_id?: string
          status?: Database["public"]["Enums"]["status_agendamento"]
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          data_criacao: string | null
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string
          ultimo_agendamento: string | null
          valor_total: number | null
        }
        Insert: {
          data_criacao?: string | null
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone: string
          ultimo_agendamento?: string | null
          valor_total?: number | null
        }
        Update: {
          data_criacao?: string | null
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string
          ultimo_agendamento?: string | null
          valor_total?: number | null
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          descricao: string | null
          id: string
          valor: string
        }
        Insert: {
          descricao?: string | null
          id: string
          valor: string
        }
        Update: {
          descricao?: string | null
          id?: string
          valor?: string
        }
        Relationships: []
      }
      datas_bloqueadas: {
        Row: {
          data: string
          descricao: string | null
          dia_todo: boolean
          id: string
          motivo: string | null
          valor: string | null
        }
        Insert: {
          data: string
          descricao?: string | null
          dia_todo?: boolean
          id?: string
          motivo?: string | null
          valor?: string | null
        }
        Update: {
          data?: string
          descricao?: string | null
          dia_todo?: boolean
          id?: string
          motivo?: string | null
          valor?: string | null
        }
        Relationships: []
      }
      mensagens_motivacionais: {
        Row: {
          data_criacao: string | null
          id: string
          mensagem: string
        }
        Insert: {
          data_criacao?: string | null
          id?: string
          mensagem: string
        }
        Update: {
          data_criacao?: string | null
          id?: string
          mensagem?: string
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          data_criacao: string | null
          descricao: string
          id: string
          lida: boolean | null
          tipo: string
        }
        Insert: {
          data_criacao?: string | null
          descricao: string
          id?: string
          lida?: boolean | null
          tipo: string
        }
        Update: {
          data_criacao?: string | null
          descricao?: string
          id?: string
          lida?: boolean | null
          tipo?: string
        }
        Relationships: []
      }
      servicos: {
        Row: {
          descricao: string | null
          duracao_minutos: number
          id: string
          nome: string
          preco: number
        }
        Insert: {
          descricao?: string | null
          duracao_minutos: number
          id?: string
          nome: string
          preco: number
        }
        Update: {
          descricao?: string | null
          duracao_minutos?: number
          id?: string
          nome?: string
          preco?: number
        }
        Relationships: []
      }
      ultima_mensagem_vista: {
        Row: {
          data_visualizacao: string | null
          id: string
          mensagem_id: string | null
        }
        Insert: {
          data_visualizacao?: string | null
          id?: string
          mensagem_id?: string | null
        }
        Update: {
          data_visualizacao?: string | null
          id?: string
          mensagem_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ultima_mensagem_vista_mensagem_id_fkey"
            columns: ["mensagem_id"]
            isOneToOne: false
            referencedRelation: "mensagens_motivacionais"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      status_agendamento: "confirmado" | "pendente" | "cancelado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      status_agendamento: ["confirmado", "pendente", "cancelado"],
    },
  },
} as const
