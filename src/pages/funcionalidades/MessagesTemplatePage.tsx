import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Plus, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
const MessagesTemplatePage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<{
    id: string;
    type: string;
    message: string;
  } | null>(null);
  const templates = [{
    id: '1',
    type: 'confirmação',
    message: 'Olá {{nome}}! Confirmando seu agendamento para {{serviço}} no dia {{data}} às {{hora}}. Aguardo você!'
  }, {
    id: '2',
    type: 'lembrete',
    message: 'Olá {{nome}}! Lembrando do seu horário amanhã às {{hora}} para {{serviço}}. Até lá!'
  }, {
    id: '3',
    type: 'reagendamento',
    message: 'Olá {{nome}}! Preciso remarcar seu horário do dia {{data}}. Podemos reagendar para outra data?'
  }];
  const handleEdit = (template: {
    id: string;
    type: string;
    message: string;
  }) => {
    setEditingTemplate(template);
    setOpen(true);
  };
  const handleSave = () => {
    // Save logic would go here
    setOpen(false);
    setEditingTemplate(null);
  };
  return <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6 px-0">
        <div className="flex items-center">
          <MessageSquare className="h-6 w-6 mr-2" />
          <h1 className="font-bold text-xl">Configure as Mensagens</h1>
        </div>
        <Button onClick={() => setOpen(true)} className="text-sm px-[8px]">
          <Plus className="h-4 w-4 mr-2" />
          Nova Mensagem
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="bg-accent/20 p-4 rounded-md">
          <h3 className="mb-2 font-bold">Variáveis disponíveis:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <code className="bg-accent p-1 rounded text-sm">{"{{nome}}"}</code>
            <code className="bg-accent p-1 rounded text-sm">{"{{serviço}}"}</code>
            <code className="bg-accent p-1 rounded text-sm">{"{{data}}"}</code>
            <code className="bg-accent p-1 rounded text-sm">{"{{hora}}"}</code>
            <code className="bg-accent p-1 rounded text-sm">{"{{valor}}"}</code>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {templates.map(template => <Card key={template.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="capitalize font-bold">Mensagem de {template.type}</p>
                    <p className="text-sm whitespace-pre-wrap">{template.message}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div>
      </div>

      {templates.length === 0 && <div className="text-center py-10 bg-accent/10 rounded-lg mt-4">
          <p className="text-muted-foreground">Nenhum template de mensagem cadastrado.</p>
        </div>}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Editar Mensagem' : 'Nova Mensagem'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Mensagem</Label>
              <Select defaultValue={editingTemplate?.type || "confirmação"}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmação">Confirmação</SelectItem>
                  <SelectItem value="lembrete">Lembrete</SelectItem>
                  <SelectItem value="reagendamento">Reagendamento</SelectItem>
                  <SelectItem value="cancelamento">Cancelamento</SelectItem>
                  <SelectItem value="aniversário">Aniversário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea id="message" placeholder="Digite a mensagem com as variáveis" rows={6} defaultValue={editingTemplate?.message || ''} />
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
export default MessagesTemplatePage;