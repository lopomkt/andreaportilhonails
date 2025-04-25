
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Save, Copy, RefreshCw, Eye } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type TemplateType = "confirmation" | "reminder" | "reengagement";

interface MessageTemplate {
  id: TemplateType;
  name: string;
  content: string;
  description: string;
  emoji: string;
}

const defaultTemplates: Record<TemplateType, MessageTemplate> = {
  confirmation: {
    id: "confirmation",
    name: "Confirmação de Agendamento",
    content: "Olá {{nome}} 💅✨ Seu agendamento para {{serviço}} está confirmado para {{data}} às {{horário}}. Valor: {{valor}}. Estou ansiosa para te receber! Qualquer mudança, me avise com antecedência, ok? 💕",
    description: "Enviada quando um agendamento é confirmado",
    emoji: "✅"
  },
  reminder: {
    id: "reminder",
    name: "Lembrete 1 dia antes",
    content: "Oi {{nome}} 👋 Passando para lembrar do seu horário de {{serviço}} amanhã às {{horário}}. Estou te esperando! Não se atrase, tá? 💖 Se precisar remarcar, me avise o quanto antes.",
    description: "Enviada um dia antes do agendamento",
    emoji: "⏰"
  },
  reengagement: {
    id: "reengagement",
    name: "Reengajamento para cliente sumida",
    content: "Oi {{nome}}! 💕 Estou com saudades! Faz um tempinho que não te vejo por aqui. Que tal agendar um horário para cuidar das suas unhas? Tenho novidades que você vai amar! 💅✨ Me avisa quando quiser agendar!",
    description: "Enviada para clientes que não agendaram há mais de 40 dias",
    emoji: "💌"
  }
};

export function MessageTemplateEditor() {
  const [templates, setTemplates] = useState<Record<TemplateType, MessageTemplate>>(defaultTemplates);
  const [activeTab, setActiveTab] = useState<TemplateType>("confirmation");
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const { toast } = useToast();

  const handleEdit = () => {
    setEditedContent(templates[activeTab].content);
    setEditing(true);
  };

  const handleSave = () => {
    setTemplates({
      ...templates,
      [activeTab]: {
        ...templates[activeTab],
        content: editedContent
      }
    });
    setEditing(false);
    toast({
      title: "Modelo salvo",
      description: "Seu modelo de mensagem foi salvo com sucesso!",
      duration: 3000
    });
  };

  const handleCancel = () => {
    setEditing(false);
    setEditedContent("");
  };

  const handleReset = () => {
    setTemplates({
      ...templates,
      [activeTab]: defaultTemplates[activeTab]
    });
    toast({
      title: "Modelo restaurado",
      description: "Modelo de mensagem restaurado para o padrão.",
      duration: 3000
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(templates[activeTab].content);
    toast({
      title: "Copiado!",
      description: "Modelo de mensagem copiado para a área de transferência.",
      duration: 3000
    });
  };

  const getPreviewContent = () => {
    const content = templates[activeTab].content
      .replace(/{{nome}}/g, "Maria Silva")
      .replace(/{{serviço}}/g, "Unhas em Gel")
      .replace(/{{data}}/g, "15/05/2025")
      .replace(/{{horário}}/g, "14:30")
      .replace(/{{valor}}/g, "R$ 120,00");
    return content;
  };

  return (
    <Card className="card-premium">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <MessageCircle className="h-5 w-5" />
          Modelos de Mensagem
        </CardTitle>
        <CardDescription>
          Configure os modelos de mensagem para diferentes situações
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TemplateType)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="confirmation">Confirmação</TabsTrigger>
            <TabsTrigger value="reminder">Lembrete</TabsTrigger>
            <TabsTrigger value="reengagement">Reengajamento</TabsTrigger>
          </TabsList>

          {Object.entries(templates).map(([key, template]) => (
            <TabsContent key={key} value={key}>
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    <span className="mr-2">{template.emoji}</span>
                    {template.description}
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Mensagem</Label>
                  {editing && activeTab === key ? (
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={6}
                      className="font-mono"
                    />
                  ) : (
                    <div className="p-4 rounded-md bg-muted font-mono whitespace-pre-wrap">
                      {template.content}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  {editing && activeTab === key ? (
                    <>
                      <Button variant="outline" onClick={handleCancel}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={handleReset}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Restaurar Padrão
                      </Button>
                      <Button variant="outline" onClick={handleCopy}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </Button>
                      <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Prévia
                      </Button>
                      <Button onClick={handleEdit}>
                        Editar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Prévia da Mensagem</DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-green-50 rounded-lg border border-green-100 my-2">
            <div className="flex items-start">
              <div className="bg-white p-2 rounded-lg shadow-sm max-w-[80%] border border-green-200">
                <p className="text-sm whitespace-pre-wrap">{getPreviewContent()}</p>
                <p className="text-[10px] text-gray-400 text-right mt-1">14:30</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">Assim será exibida a mensagem no WhatsApp</p>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
