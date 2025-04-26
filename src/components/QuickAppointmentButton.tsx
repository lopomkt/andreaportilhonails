
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { AppointmentForm } from "./AppointmentForm";
import { AppointmentFormWrapper } from "./AppointmentFormWrapper";
import { useServices } from "@/context/ServiceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export function QuickAppointmentButton() {
  const [open, setOpen] = useState(false);
  const [initialDate, setInitialDate] = useState<Date | undefined>(undefined);
  const { services, fetchServices, loading } = useServices();
  
  // Load services when component mounts
  useEffect(() => {
    const loadServices = async () => {
      try {
        console.log("QuickAppointmentButton: Carregando serviços...");
        await fetchServices();
        console.log("QuickAppointmentButton: Serviços carregados:", services.length);
      } catch (error) {
        console.error("QuickAppointmentButton: Erro ao carregar serviços:", error);
        toast({
          title: "Erro ao carregar serviços",
          description: "Não foi possível carregar a lista de serviços. Tente novamente.",
          variant: "destructive",
        });
      }
    };
    
    loadServices();
  }, [fetchServices]);
  
  // Reload services when modal opens
  useEffect(() => {
    if (open) {
      console.log("QuickAppointmentButton: Modal aberto, verificando serviços...");
      // Make sure services are loaded when modal is opened
      fetchServices().then(() => {
        console.log("QuickAppointmentButton: Serviços atualizados no modal:", services.length);
      }).catch(error => {
        console.error("QuickAppointmentButton: Erro ao carregar serviços no modal:", error);
      });
      
      // Check for stored date in localStorage
      try {
        const storedDate = localStorage.getItem('defaultAppointmentDate');
        if (storedDate) {
          const parsedDate = new Date(storedDate);
          if (!isNaN(parsedDate.getTime())) {
            setInitialDate(parsedDate);
          }
          // Clear after use
          localStorage.removeItem('defaultAppointmentDate');
        } else {
          setInitialDate(undefined);
        }
      } catch (error) {
        console.error("Erro ao analisar a data armazenada:", error);
        setInitialDate(undefined);
      }
    }
  }, [open, fetchServices]);

  // Expose method to open the dialog through window object
  useEffect(() => {
    // Create a global function that can be called from anywhere
    window.openQuickAppointmentModal = (defaultDate?: Date) => {
      if (defaultDate) {
        localStorage.setItem('defaultAppointmentDate', defaultDate.toISOString());
      } else {
        localStorage.removeItem('defaultAppointmentDate');
      }
      setOpen(true);
    };
    return () => {
      // Clean up when component unmounts
      delete window.openQuickAppointmentModal;
    };
  }, []);
  
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen} modal={true}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border-rose-100 shadow-premium">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center">
              <span className="mr-2">💅</span>
              Novo Agendamento
            </DialogTitle>
          </DialogHeader>
          <AppointmentFormWrapper>
            <AppointmentForm onSuccess={() => setOpen(false)} initialDate={initialDate} />
          </AppointmentFormWrapper>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Add the global type declaration for TypeScript
declare global {
  interface Window {
    openQuickAppointmentModal?: (defaultDate?: Date) => void;
  }
}
