import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarX, Plus, Edit, Trash2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
const CancellationReasonsPage: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<{
    id: string;
    reason: string;
  } | null>(null);
  const reasons = [{
    id: '1',
    reason: 'Cliente desmarcou'
  }, {
    id: '2',
    reason: 'Manicure indisponível'
  }, {
    id: '3',
    reason: 'Problema de saúde'
  }, {
    id: '4',
    reason: 'Cliente não compareceu'
  }];
  const handleEdit = (reason: {
    id: string;
    reason: string;
  }) => {
    setEditingReason(reason);
    setOpen(true);
  };
  const handleSave = () => {
    // Save logic would go here
    setOpen(false);
    setEditingReason(null);
  };
  return <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <CalendarX className="h-6 w-6 mr-2" />
          <h1 className="font-bold text-lg">Motivos Prontos</h1>
        </div>
        <Button onClick={() => setOpen(true)} className="text-sm px-[10px]">
          <Plus className="h-4 w-4 mr-2" />
          Novo Motivo
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {reasons.map(reason => <Card key={reason.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <p>{reason.reason}</p>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(reason)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>)}
      </div>

      {reasons.length === 0 && <div className="text-center py-10 bg-accent/10 rounded-lg mt-4">
          <p className="text-muted-foreground">Nenhum motivo de cancelamento cadastrado.</p>
        </div>}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReason ? 'Editar Motivo' : 'Novo Motivo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo</Label>
              <Input id="reason" placeholder="Digite o motivo de cancelamento" defaultValue={editingReason?.reason || ''} />
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
export default CancellationReasonsPage;