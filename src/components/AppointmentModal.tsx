
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AppointmentFormWrapper } from './AppointmentFormWrapper';
import { AppointmentForm } from './AppointmentForm';
import { useAppointmentsModal } from '@/context/AppointmentsModalContext';
import { Loader } from 'lucide-react';
import { useServices } from '@/context/ServiceContext';
import { useData } from '@/context/DataContext';
import { toast } from '@/hooks/use-toast';

export function AppointmentModal() {
  const { isOpen, closeModal, selectedClient, selectedDate } = useAppointmentsModal();
  const { services, loading: servicesLoading, fetchServices } = useServices();

  // Force fetch services when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log("AppointmentModal opened, fetching services...");
      fetchServices();
    }
  }, [isOpen, fetchServices]);

  const handleSuccess = () => {
    toast({
      title: "Sucesso!",
      description: "Agendamento criado com sucesso.",
    });
    closeModal();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border-rose-100 shadow-premium">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <span className="mr-2">💅</span>
            {selectedClient ? `Agendar para ${selectedClient.name}` : 'Novo Agendamento'}
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
              onSuccess={handleSuccess}
            />
          </AppointmentFormWrapper>
        )}
      </DialogContent>
    </Dialog>
  );
}
