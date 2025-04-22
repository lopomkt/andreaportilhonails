
import { supabase } from './client';
import { Appointment, AppointmentStatus, BlockedDate, Client, Service, WhatsAppMessageData } from '@/types';
import {
  mapDbAppointmentToApp,
  mapAppAppointmentToDb,
  mapDbClientToApp,
  mapDbServiceToApp,
  mapDbBlockedDateToApp,
  mapAppStatusToDbStatus
} from './mappers';
import {
  DbAppointment,
  DbClient,
  DbService,
  DbAppointmentInsert,
  DbAppointmentUpdate,
  DbBlockedDate,
  DbBlockedDateInsert
} from './database-types';

// Define a type for appointment with relationships as returned by Supabase
interface AppointmentWithRelations extends DbAppointment {
  clientes: DbClient;
  servicos: DbService;
}

export const appointmentService = {
  async getAll(): Promise<Appointment[]> {
    try {
      const { data: appointments, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          clientes (*),
          servicos (*)
        `)
        .order('data', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }

      return (appointments as AppointmentWithRelations[]).map(appt => {
        return mapDbAppointmentToApp(appt, appt.clientes, appt.servicos);
      });
    } catch (error) {
      console.error('Unexpected error fetching appointments:', error);
      return [];
    }
  },

  async getByDate(date: Date): Promise<Appointment[]> {
    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const { data: appointments, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          clientes (*),
          servicos (*)
        `)
        .gte('data', startDate.toISOString())
        .lte('data', endDate.toISOString())
        .order('data', { ascending: true });

      if (error) {
        console.error('Error fetching appointments by date:', error);
        return [];
      }

      return (appointments as AppointmentWithRelations[]).map(appt => {
        return mapDbAppointmentToApp(appt, appt.clientes, appt.servicos);
      });
    } catch (error) {
      console.error('Unexpected error fetching appointments by date:', error);
      return [];
    }
  },

  async create(appointment: Omit<Appointment, 'id'>): Promise<Appointment | null> {
    try {
      // Calculate end time based on date and service duration
      const appointmentDate = new Date(appointment.date);
      const endTime = new Date(appointmentDate);
      
      if (appointment.service?.durationMinutes) {
        endTime.setMinutes(endTime.getMinutes() + appointment.service.durationMinutes);
      } else {
        // Default to 1 hour if no duration is provided
        endTime.setHours(endTime.getHours() + 1);
      }

      // Ensure dates are converted to ISO strings for Supabase
      const appointmentDateString = appointmentDate.toISOString();
      const endTimeString = endTime.toISOString();

      // We need to ensure all required fields are present
      const insertData: DbAppointmentInsert = {
        cliente_id: appointment.clientId,
        servico_id: appointment.serviceId,
        data: appointmentDateString,
        hora_fim: endTimeString,
        preco: appointment.price,
        // Optional fields
        status: appointment.status ? mapAppStatusToDbStatus(appointment.status) : 'pendente',
        observacoes: appointment.notes,
        motivo_cancelamento: appointment.cancellationReason,
        status_confirmacao: appointment.confirmationStatus
      };

      const { data, error } = await supabase
        .from('agendamentos')
        .insert(insertData as any) // Type assertion to bypass Supabase's strict typing
        .select(`
          *,
          clientes (*),
          servicos (*)
        `)
        .single();

      if (error) {
        console.error('Error creating appointment:', error);
        return null;
      }

      const result = data as AppointmentWithRelations;
      return mapDbAppointmentToApp(result, result.clientes, result.servicos);
    } catch (error) {
      console.error('Unexpected error creating appointment:', error);
      return null;
    }
  },

  async update(id: string, updates: Partial<Appointment>): Promise<boolean> {
    try {
      const dbUpdates = mapAppAppointmentToDb(updates);
      
      // If we're updating the date, recalculate the end time
      if (updates.date) {
        const endTime = new Date(updates.date);
        
        // Get the service duration if possible
        let duration = 60; // Default to 1 hour
        if (updates.service?.durationMinutes) {
          duration = updates.service.durationMinutes;
        } else if (updates.serviceId) {
          // Try to fetch the service
          const { data: serviceData } = await supabase
            .from('servicos')
            .select('duracao_minutos')
            .eq('id', updates.serviceId)
            .single();
            
          if (serviceData) {
            duration = serviceData.duracao_minutos;
          }
        }
        
        endTime.setMinutes(endTime.getMinutes() + duration);
        dbUpdates.hora_fim = endTime.toISOString();
      }
      
      const { error } = await supabase
        .from('agendamentos')
        .update(dbUpdates as any) // Type assertion to bypass Supabase's strict typing
        .eq('id', id);

      if (error) {
        console.error('Error updating appointment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error updating appointment:', error);
      return false;
    }
  },

  async changeStatus(id: string, status: AppointmentStatus, cancellationReason?: string): Promise<boolean> {
    try {
      const updates: DbAppointmentUpdate = {
        status: status === 'confirmed' ? 'confirmado' : status === 'pending' ? 'pendente' : 'cancelado'
      };

      if (status === 'canceled' && cancellationReason) {
        updates.motivo_cancelamento = cancellationReason;
      }

      const { error } = await supabase
        .from('agendamentos')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error changing appointment status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error changing appointment status:', error);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting appointment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error deleting appointment:', error);
      return false;
    }
  },

  async getWhatsAppTemplate(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('id', 'modelo_whatsapp')
        .single();

      if (error || !data) {
        console.error('Error fetching WhatsApp template:', error);
        return 'Olá {{nome}}, seu agendamento para {{servico}} está confirmado para {{data}} às {{hora}}. Valor: {{preco}}. Obrigado!';
      }

      return data.valor;
    } catch (error) {
      console.error('Unexpected error fetching WhatsApp template:', error);
      return 'Olá {{nome}}, seu agendamento para {{servico}} está confirmado para {{data}} às {{hora}}. Valor: {{preco}}. Obrigado!';
    }
  },

  async updateWhatsAppTemplate(template: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('configuracoes')
        .update({ valor: template })
        .eq('id', 'modelo_whatsapp');

      if (error) {
        console.error('Error updating WhatsApp template:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error updating WhatsApp template:', error);
      return false;
    }
  },

  generateWhatsAppLink(phoneNumber: string, message: string): string {
    // Remove any non-digit characters from the phone number
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    // Make sure the phone number has the country code (Brazil: 55)
    const fullNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
    // Encode the message for a URL
    const encodedMessage = encodeURIComponent(message);
    
    return `https://wa.me/${fullNumber}?text=${encodedMessage}`;
  },

  // Helper method to create a WhatsApp message from data
  generateMessageFromData(data: WhatsAppMessageData): string {
    if (data.message) {
      return data.message;
    }

    if (!data.appointment || !data.client) {
      return '';
    }

    // Get the template and replace placeholders
    return this.getWhatsAppTemplate().then(template => {
      const date = new Date(data.appointment!.date);
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      
      return template
        .replace('{{nome}}', data.client?.name || '')
        .replace('{{servico}}', data.appointment?.service?.name || '')
        .replace('{{data}}', formattedDate)
        .replace('{{hora}}', formattedTime)
        .replace('{{preco}}', data.appointment?.price.toLocaleString('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        }) || '');
    });
  },

  // Methods for blocked dates
  async createBlockedDate(blockedDate: { date: Date; reason?: string; allDay: boolean }): Promise<BlockedDate | null> {
    try {
      const blockedDateData: DbBlockedDateInsert = {
        data: blockedDate.date.toISOString(),
        motivo: blockedDate.reason || null,
        dia_todo: blockedDate.allDay
      };

      const { data, error } = await supabase
        .from('datas_bloqueadas')
        .insert(blockedDateData)
        .select()
        .single();

      if (error) {
        console.error('Error creating blocked date:', error);
        return null;
      }

      return mapDbBlockedDateToApp(data as DbBlockedDate);
    } catch (error) {
      console.error('Unexpected error creating blocked date:', error);
      return null;
    }
  },

  async deleteBlockedDate(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('datas_bloqueadas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting blocked date:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error deleting blocked date:', error);
      return false;
    }
  },

  async getBlockedDates(): Promise<BlockedDate[]> {
    try {
      const { data, error } = await supabase
        .from('datas_bloqueadas')
        .select('*');

      if (error) {
        console.error('Error fetching blocked dates:', error);
        return [];
      }

      return (data as DbBlockedDate[]).map(mapDbBlockedDateToApp);
    } catch (error) {
      console.error('Unexpected error fetching blocked dates:', error);
      return [];
    }
  }
};
