export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agendamentos_novo: {
        Row: {
          cliente_id: string
          created_at: string | null
          data_fim: string
          data_inicio: string
          id: string
          motivo_cancelamento: string | null
          observacoes: string | null
          preco: number
          servico_id: string
          status: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          data_fim: string
          data_inicio: string
          id?: string
          motivo_cancelamento?: string | null
          observacoes?: string | null
          preco: number
          servico_id: string
          status?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          id?: string
          motivo_cancelamento?: string | null
          observacoes?: string | null
          preco?: number
          servico_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_novo_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_novo_servico_id_fkey"
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
          data_nascimento: string | null
          data_ultimo_agendamento: string | null
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
          data_nascimento?: string | null
          data_ultimo_agendamento?: string | null
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
          data_nascimento?: string | null
          data_ultimo_agendamento?: string | null
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
          updated_at: string | null
          valor: string | null
        }
        Insert: {
          descricao?: string | null
          id: string
          updated_at?: string | null
          valor?: string | null
        }
        Update: {
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor?: string | null
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
          id: string
          mensagem: string
        }
        Insert: {
          id?: string
          mensagem: string
        }
        Update: {
          id?: string
          mensagem?: string
        }
        Relationships: []
      }
      mensagens_templates: {
        Row: {
          created_at: string | null
          id: string
          mensagem: string
          tipo: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mensagem: string
          tipo: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mensagem?: string
          tipo?: string
        }
        Relationships: []
      }
      motivos_cancelamento: {
        Row: {
          id: string
          reason: string
        }
        Insert: {
          id?: string
          reason: string
        }
        Update: {
          id?: string
          reason?: string
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
          duracao_minutos?: number
          id?: string
          nome: string
          preco?: number
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
          data_visualizacao: string
          id: string
          mensagem_id: string
          proxima_atualizacao: string | null
        }
        Insert: {
          data_visualizacao?: string
          id: string
          mensagem_id: string
          proxima_atualizacao?: string | null
        }
        Update: {
          data_visualizacao?: string
          id?: string
          mensagem_id?: string
          proxima_atualizacao?: string | null
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
