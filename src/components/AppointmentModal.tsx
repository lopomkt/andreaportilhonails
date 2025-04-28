
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AppointmentFormWrapper } from './AppointmentFormWrapper';
import { AppointmentForm } from './AppointmentForm';
import { useAppointmentsModal } from '@/context/AppointmentsModalContext';
import { Loader } from 'lucide-react';
import { useServices } from '@/context/ServiceContext';
import { useData } from '@/context/DataProvider';

export function AppointmentModal() {
  const { isOpen, closeModal, selectedClient, selectedDate, selectedAppointment } = useAppointmentsModal();
  const { services, loading: servicesLoading, fetchServices } = useServices();
  const { fetchAppointments, fetchBlockedDates, fetchClients } = useData();

  // Force fetch services and data when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log("AppointmentModal opened, fetching data...");
      fetchServices();
      fetchClients();
      fetchBlockedDates();
    }
  }, [isOpen, fetchServices, fetchClients, fetchBlockedDates]);

  // Handle successful appointment creation or update
  const handleAppointmentSuccess = async () => {
    closeModal();
    
    // Refresh all relevant data
    await Promise.all([
      fetchAppointments(),
      fetchBlockedDates(),
      fetchClients()
    ]);
    
    console.log("All data refreshed after appointment success");
  };

  const title = selectedAppointment 
    ? "Editar Agendamento" 
    : selectedClient 
      ? `Agendar para ${selectedClient.name}` 
      : 'Novo Agendamento';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border-rose-100 shadow-premium">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <span className="mr-2">💅</span>
            {title}
          </DialogTitle>
        </DialogHeader>
        {servicesLoading && services.length === 0 ? (
          <div className="flex justify-center items-center py-10">
            <Loader className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Carregando serviços...</span>
          </div>
        ) : (
          <AppointmentFormWrapper>
            <AppointmentForm 
              initialDate={selectedDate || undefined}
              appointment={selectedAppointment}
              onSuccess={handleAppointmentSuccess}
            />
          </AppointmentFormWrapper>
        )}
      </DialogContent>
    </Dialog>
  );
}
