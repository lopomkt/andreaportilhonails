import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Plus, Edit, Trash2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageTemplate } from '@/types';

const MessagesTemplatePage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [formType, setFormType] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const { toast } = useToast();
  
  // Buscar templates do banco de dados ou usar padrões
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        // Tentar buscar da tabela de templates
        const { data, error } = await supabase
          .from('mensagens_templates')
          .select('*');
          
        if (error) {
          console.error("Erro ao buscar templates:", error);
          throw error;
        }
        
        if (data && data.length > 0) {
          // Usar dados do banco
          setTemplates(data.map(item => ({
            id: item.id,
            type: item.tipo,
            message: item.mensagem
          })));
        } else {
          // Usar templates padrão se não houver dados
          const defaultTemplates = [
            {
              id: "confirmation",
              type: "confirmação",
              message: "Olá {{nome}}! 💅✨ Seu agendamento está confirmado. Estou ansiosa para te receber! Qualquer mudança, me avise com antecedência, ok? 💕"
            },
            {
              id: "reminder",
              type: "lembrete",
              message: "Oi {{nome}} 👋 Passando para lembrar do seu horário amanhã. Estou te esperando! Não se atrase, tá? 💖 Se precisar remarcar, me avise o quanto antes."
            },
            {
              id: "reengagement",
              type: "reengajamento",
              message: "Oi {{nome}}! 💕 Estou com saudades! Faz um tempinho que não te vejo por aqui. Que tal agendar um horário para cuidar das suas unhas? Tenho novidades que você vai amar! 💅✨ Me avisa quando quiser agendar!"
            }
          ];
          
          setTemplates(defaultTemplates);
          
          // Criar tabela e inserir templates padrão se não existirem
          try {
            for (const template of defaultTemplates) {
              await supabase
                .from('mensagens_templates')
                .insert({
                  id: template.id,
                  tipo: template.type,
                  mensagem: template.message
                });
            }
          } catch (insertError) {
            console.error("Erro ao inserir templates padrão:", insertError);
          }
        }
      } catch (error) {
        console.error("Erro ao configurar templates:", error);
        // Fallback para templates padrão
        setTemplates([
          {
            id: "confirmation",
            type: "confirmação",
            message: "Olá {{nome}}! 💅✨ Seu agendamento está confirmado. Estou ansiosa para te receber! Qualquer mudança, me avise com antecedência, ok? 💕"
          },
          {
            id: "reminder",
            type: "lembrete",
            message: "Oi {{nome}} 👋 Passando para lembrar do seu horário amanhã. Estou te esperando! Não se atrase, tá? 💖 Se precisar remarcar, me avise o quanto antes."
          },
          {
            id: "reengagement",
            type: "reengajamento",
            message: "Oi {{nome}}! 💕 Estou com saudades! Faz um tempinho que não te vejo por aqui. Que tal agendar um horário para cuidar das suas unhas? Tenho novidades que você vai amar! 💅✨ Me avisa quando quiser agendar!"
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormType(template.type);
    setFormMessage(template.message);
    setOpen(true);
  };
  
  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setFormType("");
    setFormMessage("");
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!formType || !formMessage) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos",
          variant: "destructive",
        });
        return;
      }
      
      let updatedTemplates: MessageTemplate[];
      
      if (editingTemplate) {
        // Atualizar template existente
        await supabase
          .from('mensagens_templates')
          .update({
            tipo: formType,
            mensagem: formMessage
          })
          .eq('id', editingTemplate.id);
          
        updatedTemplates = templates.map(t => 
          t.id === editingTemplate.id 
            ? { ...t, type: formType, message: formMessage } 
            : t
        );
        
        toast({
          title: "Template atualizado",
          description: "O modelo de mensagem foi atualizado com sucesso",
        });
      } else {
        // Criar novo template
        const newId = `template_${Date.now()}`;
        
        await supabase
          .from('mensagens_templates')
          .insert({
            id: newId,
            tipo: formType,
            mensagem: formMessage
          });
          
        const newTemplate = {
          id: newId,
          type: formType,
          message: formMessage
        };
        
        updatedTemplates = [...templates, newTemplate];
        
        toast({
          title: "Template criado",
          description: "Novo modelo de mensagem criado com sucesso",
        });
      }
      
      setTemplates(updatedTemplates);
      setOpen(false);
      setEditingTemplate(null);
      setFormType("");
      setFormMessage("");
    } catch (error) {
      console.error("Erro ao salvar template:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o modelo de mensagem",
        variant: "destructive",
      });
    }
  };
  
  const handleDelete = async (templateId: string) => {
    try {
      await supabase
        .from('mensagens_templates')
        .delete()
        .eq('id', templateId);
        
      setTemplates(templates.filter(t => t.id !== templateId));
      
      toast({
        title: "Template removido",
        description: "O modelo de mensagem foi removido com sucesso",
      });
    } catch (error) {
      console.error("Erro ao remover template:", error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o modelo de mensagem",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6 px-0">
        <div className="flex items-center">
          <MessageSquare className="h-6 w-6 mr-2" />
          <h1 className="font-bold text-xl">Configure as Mensagens</h1>
        </div>
        <Button onClick={handleNewTemplate} className="text-sm px-[8px]">
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
            <code className="bg-accent p-1 rounded text-sm">{"{{horário}}"}</code>
            <code className="bg-accent p-1 rounded text-sm">{"{{valor}}"}</code>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-10">
            <p>Carregando templates...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {templates.map(template => (
              <Card key={template.id}>
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {templates.length === 0 && (
              <div className="text-center py-10 bg-accent/10 rounded-lg">
                <p className="text-muted-foreground">Nenhum template de mensagem cadastrado.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Editar Mensagem' : 'Nova Mensagem'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Mensagem</Label>
              <Input
                id="type"
                placeholder="Ex: confirmação, lembrete, etc."
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea 
                id="message" 
                placeholder="Digite a mensagem com as variáveis {{nome}}, {{serviço}}, etc." 
                rows={6} 
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessagesTemplatePage;
