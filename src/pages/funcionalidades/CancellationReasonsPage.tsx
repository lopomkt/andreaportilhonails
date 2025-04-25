
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarX, Plus, Edit, Trash2 } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";

const CancellationReasonsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reasonText, setReasonText] = useState('');
  const [editingReason, setEditingReason] = useState<{
    id: string;
    reason: string;
  } | null>(null);
  const [reasons, setReasons] = useState<{
    id: string;
    reason: string;
  }[]>([
    {
      id: '1',
      reason: 'Cliente desmarcou'
    }, 
    {
      id: '2',
      reason: 'Manicure indisponível'
    }, 
    {
      id: '3',
      reason: 'Problema de saúde'
    }, 
    {
      id: '4',
      reason: 'Cliente não compareceu'
    }
  ]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedReasons = localStorage.getItem('cancellationReasons');
    if (savedReasons) {
      setReasons(JSON.parse(savedReasons));
    }
  }, []);

  // Save data to localStorage whenever reasons change
  useEffect(() => {
    localStorage.setItem('cancellationReasons', JSON.stringify(reasons));
  }, [reasons]);

  const handleEdit = (reason: {
    id: string;
    reason: string;
  }) => {
    setEditingReason(reason);
    setReasonText(reason.reason);
    setOpen(true);
  };

  const handleSave = () => {
    if (!reasonText.trim()) {
      toast({
        title: "Erro",
        description: "O motivo não pode estar em branco",
        variant: "destructive"
      });
      return;
    }

    if (editingReason) {
      // Update existing reason
      setReasons(prev => prev.map(item => 
        item.id === editingReason.id 
          ? { ...item, reason: reasonText } 
          : item
      ));
      toast({
        title: "Sucesso",
        description: "Motivo atualizado com sucesso"
      });
    } else {
      // Add new reason
      const newReason = {
        id: uuidv4(),
        reason: reasonText
      };
      setReasons(prev => [...prev, newReason]);
      toast({
        title: "Sucesso",
        description: "Novo motivo adicionado com sucesso"
      });
    }
    
    setOpen(false);
    setEditingReason(null);
    setReasonText('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este motivo?")) {
      setReasons(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Sucesso",
        description: "Motivo excluído com sucesso"
      });
    }
  };

  return <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <CalendarX className="h-6 w-6 mr-2" />
          <h1 className="font-bold text-lg">Motivos Prontos</h1>
        </div>
        <Button onClick={() => {
          setEditingReason(null);
          setReasonText('');
          setOpen(true);
        }} className="text-sm px-[10px]">
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
                <Button variant="ghost" size="sm" onClick={() => handleDelete(reason.id)}>
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
              <Input 
                id="reason" 
                placeholder="Digite o motivo de cancelamento" 
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
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

export default CancellationReasonsPage;
