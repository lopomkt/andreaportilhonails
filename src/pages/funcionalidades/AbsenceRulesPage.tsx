
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Plus, Edit, Trash2, CalendarX } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";

interface Absence {
  id: string;
  date: Date;
  reason: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
}

const AbsenceRulesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [allDay, setAllDay] = useState(true);
  const [reason, setReason] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);

  const [absences, setAbsences] = useState<Absence[]>([
    {
      id: '1',
      date: new Date(2024, 3, 20),
      reason: 'Folga pessoal',
      allDay: true
    }, 
    {
      id: '2',
      date: new Date(2024, 3, 25),
      reason: 'Consulta médica',
      allDay: false,
      startTime: '14:00',
      endTime: '16:00'
    }
  ]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedAbsences = localStorage.getItem('absences');
    if (savedAbsences) {
      setAbsences(JSON.parse(savedAbsences).map((absence: any) => ({
        ...absence,
        date: new Date(absence.date)
      })));
    }
  }, []);

  // Save data to localStorage whenever absences change
  useEffect(() => {
    localStorage.setItem('absences', JSON.stringify(absences));
  }, [absences]);

  const resetForm = () => {
    setDate(undefined);
    setAllDay(true);
    setReason('');
    setStartTime('');
    setEndTime('');
    setEditingAbsence(null);
  };

  const handleSave = () => {
    if (!date || !reason.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Data e motivo são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (!allDay && (!startTime || !endTime)) {
      toast({
        title: "Campos obrigatórios",
        description: "Horário de início e fim são obrigatórios quando não é dia inteiro",
        variant: "destructive"
      });
      return;
    }

    const absenceData: Absence = {
      id: editingAbsence ? editingAbsence.id : uuidv4(),
      date,
      reason,
      allDay,
      ...(allDay ? {} : { startTime, endTime })
    };

    if (editingAbsence) {
      // Update existing absence
      setAbsences(prev => prev.map(item => 
        item.id === editingAbsence.id ? absenceData : item
      ));
      toast({
        title: "Sucesso",
        description: "Ausência atualizada com sucesso"
      });
    } else {
      // Add new absence
      setAbsences(prev => [...prev, absenceData]);
      toast({
        title: "Sucesso",
        description: "Nova ausência adicionada com sucesso"
      });
    }
    
    setOpen(false);
    resetForm();
  };

  const handleEdit = (absence: Absence) => {
    setEditingAbsence(absence);
    setDate(absence.date);
    setAllDay(absence.allDay);
    setReason(absence.reason);
    setStartTime(absence.startTime || '');
    setEndTime(absence.endTime || '');
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta ausência?")) {
      setAbsences(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Sucesso",
        description: "Ausência excluída com sucesso"
      });
    }
  };

  return <div className="container mx-auto p-4 px-[20px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 mr-2" />
          <h1 className="font-bold text-lg">Regras de Ausência</h1>
        </div>
        <Button onClick={() => {
          resetForm();
          setOpen(true);
        }} className="px-[12px]">
          <Plus className="h-4 w-4 mr-2" />
          Nova Ausência
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {absences.map(absence => <Card key={absence.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{format(absence.date, 'dd/MM/yyyy', {
                locale: ptBR
              })}</p>
                <p className="text-sm text-muted-foreground">{absence.reason}</p>
                <p className="text-xs text-muted-foreground">
                  {absence.allDay 
                    ? 'Dia inteiro' 
                    : `${absence.startTime} - ${absence.endTime}`
                  }
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(absence)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(absence.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>)}
      </div>

      {absences.length === 0 && <div className="text-center py-10 bg-accent/10 rounded-lg mt-4">
          <p className="text-muted-foreground">Nenhuma ausência cadastrada.</p>
        </div>}
      
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
                  onCheckedChange={(checked) => setAllDay(checked as boolean)} 
                />
                <span>Dia inteiro</span>
              </Label>
            </div>
            
            {!allDay && <div className="grid grid-cols-2 gap-4">
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
              </div>}
            
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
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};

export default AbsenceRulesPage;
