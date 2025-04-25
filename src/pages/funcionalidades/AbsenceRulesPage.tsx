import React, { useState } from 'react';
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
const AbsenceRulesPage: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [allDay, setAllDay] = useState(true);
  const absences = [{
    id: '1',
    date: new Date(2024, 3, 20),
    reason: 'Folga pessoal',
    allDay: true
  }, {
    id: '2',
    date: new Date(2024, 3, 25),
    reason: 'Consulta médica',
    allDay: false
  }];
  const handleSave = () => {
    // Save logic would go here
    setOpen(false);
    setDate(undefined);
    setAllDay(true);
  };
  return <div className="container mx-auto p-4 px-[20px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 mr-2" />
          <h1 className="font-bold text-lg">Regras de Ausência</h1>
        </div>
        <Button onClick={() => setOpen(true)} className="px-[12px]">
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
                  {absence.allDay ? 'Dia inteiro' : 'Horário específico'}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>)}
      </div>

      {absences.length === 0 && <div className="text-center py-10 bg-accent/10 rounded-lg mt-4">
          <p className="text-muted-foreground">Nenhuma ausência cadastrada.</p>
        </div>}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nova Ausência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Data</Label>
              <div className="border rounded-md p-3">
                <CalendarComponent mode="single" selected={date} onSelect={setDate} className="mx-auto" locale={ptBR} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="all-day" className="flex items-center space-x-2">
                <Checkbox id="all-day" checked={allDay} onCheckedChange={checked => setAllDay(checked as boolean)} />
                <span>Dia inteiro</span>
              </Label>
            </div>
            
            {!allDay && <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Hora início</Label>
                  <Input id="start-time" type="time" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">Hora fim</Label>
                  <Input id="end-time" type="time" />
                </div>
              </div>}
            
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo</Label>
              <Input id="reason" placeholder="Digite o motivo da ausência" />
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