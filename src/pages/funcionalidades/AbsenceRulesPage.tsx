
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Plus, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { AbsenceRule } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AbsenceRulesPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [absences, setAbsences] = useState<AbsenceRule[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [editingAbsence, setEditingAbsence] = useState<AbsenceRule | null>(null);
  
  const { toast } = useToast();
  
  useEffect(() => {
    fetchAbsenceRules();
  }, []);
  
  const fetchAbsenceRules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('datas_bloqueadas')
        .select('*')
        .order('data', { ascending: false });
        
      if (error) throw error;
      
      // Map database data to app model
      const mappedData: AbsenceRule[] = data.map(item => ({
        id: item.id,
        date: item.data,
        startTime: item.valor && !item.dia_todo ? item.valor.split('-')[0] : undefined,
        endTime: item.valor && !item.dia_todo ? item.valor.split('-')[1] : undefined,
        reason: item.motivo || '',
        allDay: item.dia_todo
      }));
      
      setAbsences(mappedData);
    } catch (error: any) {
      console.error("Error fetching absence rules:", error.message);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as regras de ausência",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setDate(undefined);
    setAllDay(true);
    setStartTime('');
    setEndTime('');
    setReason('');
    setEditingAbsence(null);
  };
  
  const handleOpenNew = () => {
    resetForm();
    setOpen(true);
  };
  
  const handleEdit = (absence: AbsenceRule) => {
    setEditingAbsence(absence);
    
    // Set form values
    setDate(isValid(new Date(absence.date)) ? new Date(absence.date) : undefined);
    setAllDay(absence.allDay);
    setStartTime(absence.startTime || '');
    setEndTime(absence.endTime || '');
    setReason(absence.reason || '');
    
    setOpen(true);
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta regra de ausência?")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('datas_bloqueadas')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Regra de ausência excluída"
      });
      
      // Update local state
      setAbsences(absences.filter(a => a.id !== id));
    } catch (error: any) {
      console.error("Error deleting absence rule:", error.message);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a regra de ausência",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const validateForm = () => {
    if (!date) {
      toast({
        title: "Erro",
        description: "Selecione uma data",
        variant: "destructive"
      });
      return false;
    }
    
    if (!allDay) {
      if (!startTime) {
        toast({
          title: "Erro",
          description: "Informe a hora de início",
          variant: "destructive"
        });
        return false;
      }
      
      if (!endTime) {
        toast({
          title: "Erro",
          description: "Informe a hora de fim",
          variant: "destructive"
        });
        return false;
      }
    }
    
    if (!reason.trim()) {
      toast({
        title: "Erro",
        description: "Informe o motivo da ausência",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };
  
  const handleSave = async () => {
    if (!validateForm()) return;
    if (!date) return; // TypeScript safety check
    
    setLoading(true);
    try {
      // Prepare time value if not all day
      const timeValue = !allDay ? `${startTime}-${endTime}` : '';
      
      // Prepare data for Supabase
      const absenceData = {
        data: date.toISOString(),
        dia_todo: allDay,
        motivo: reason,
        valor: !allDay ? timeValue : null
      };
      
      if (editingAbsence) {
        // Update existing absence
        const { error } = await supabase
          .from('datas_bloqueadas')
          .update(absenceData)
          .eq('id', editingAbsence.id);
          
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Regra de ausência atualizada"
        });
        
        // Refresh data to ensure consistency
        await fetchAbsenceRules();
      } else {
        // Add new absence
        const { data: newData, error } = await supabase
          .from('datas_bloqueadas')
          .insert(absenceData)
          .select();
          
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Regra de ausência adicionada"
        });
        
        // Refresh data to ensure consistency
        await fetchAbsenceRules();
      }
      
      setOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error saving absence rule:", error.message);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a regra de ausência",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4 px-[20px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 mr-2" />
          <h1 className="font-bold text-lg">Regras de Ausência</h1>
        </div>
        <Button onClick={handleOpenNew} className="px-[12px]" disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Ausência
        </Button>
      </div>
      
      {loading && absences.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {absences.map(absence => (
            <Card key={absence.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    {isValid(new Date(absence.date)) 
                      ? format(new Date(absence.date), 'dd/MM/yyyy', { locale: ptBR })
                      : 'Data inválida'}
                  </p>
                  <p className="text-sm text-muted-foreground">{absence.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {absence.allDay 
                      ? 'Dia inteiro' 
                      : `${absence.startTime} - ${absence.endTime}`}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(absence)} disabled={loading}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(absence.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && absences.length === 0 && (
        <div className="text-center py-10 bg-accent/10 rounded-lg mt-4">
          <p className="text-muted-foreground">Nenhuma ausência cadastrada.</p>
        </div>
      )}
      
      <Dialog open={open} onOpenChange={(value) => {
        if (!value) resetForm();
        setOpen(value);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingAbsence ? 'Editar Ausência' : 'Nova Ausência'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Data</Label>
              <div className="border rounded-md p-3">
                <CalendarComponent 
                  mode="single" 
                  selected={date} 
                  onSelect={setDate} 
                  className="mx-auto" 
                  locale={ptBR}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="all-day" className="flex items-center space-x-2">
                <Checkbox 
                  id="all-day" 
                  checked={allDay} 
                  onCheckedChange={(checked) => setAllDay(checked === true)} 
                />
                <span>Dia inteiro</span>
              </Label>
            </div>
            
            {!allDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Hora início</Label>
                  <Input 
                    id="start-time" 
                    type="time" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">Hora fim</Label>
                  <Input 
                    id="end-time" 
                    type="time" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo</Label>
              <Input 
                id="reason" 
                placeholder="Digite o motivo da ausência" 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AbsenceRulesPage;
