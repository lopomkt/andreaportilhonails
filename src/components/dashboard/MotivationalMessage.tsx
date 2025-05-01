
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, addHours, isAfter } from "date-fns";

export const MotivationalMessage = () => {
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const fetchMotivationalMessage = async () => {
      try {
        // Buscar informações da última mensagem vista
        const { data: lastViewed, error: lastViewedError } = 
          await supabase.from('ultima_mensagem_vista').select('*').eq('id', 'andrea').single();

        if (lastViewedError) {
          console.error('Error fetching last viewed message:', lastViewedError);
          // Se não conseguir encontrar o registro, apenas exibir uma mensagem aleatória
          const { data: randomMsg } = await supabase.from('mensagens_motivacionais')
            .select('mensagem').order('random()').limit(1).single();
          if (randomMsg) {
            setMessage(randomMsg.mensagem);
          } else {
            setMessage("Transformando unhas, elevando autoestima!");
          }
          return;
        }
        
        const now = new Date();
        
        // Verificar se o proxima_atualizacao é uma string válida antes de tentar parseISO
        if (!lastViewed.proxima_atualizacao) {
          console.error('proxima_atualizacao is null or invalid');
          // Definir uma nova data de atualização
          const newUpdateTime = addHours(now, 12).toISOString();
          
          const { data: randomMsg } = await supabase.from('mensagens_motivacionais')
            .select('*').order('random()').limit(1).single();
          
          if (randomMsg) {
            // Atualizar o registro com uma nova mensagem e próxima data de atualização
            await supabase.from('ultima_mensagem_vista').update({
              mensagem_id: randomMsg.id,
              data_visualizacao: now.toISOString(),
              proxima_atualizacao: newUpdateTime
            }).eq('id', 'andrea');
            
            setMessage(randomMsg.mensagem);
          }
          return;
        }
        
        // Converter string para objeto Date
        const nextUpdateTime = parseISO(lastViewed.proxima_atualizacao);
        
        // Se a hora atual for maior que a próxima atualização, mostrar uma nova mensagem
        if (isAfter(now, nextUpdateTime)) {
          const { data: newMessage, error: messageError } = 
            await supabase.from('mensagens_motivacionais').select('*').order('random()').limit(1).single();
          
          if (messageError) throw messageError;
          
          // Calcular a próxima atualização (12 horas a partir de agora)
          const newUpdateTime = addHours(now, 12).toISOString();
          
          // Atualizar o registro
          await supabase.from('ultima_mensagem_vista').update({
            mensagem_id: newMessage.id,
            data_visualizacao: now.toISOString(),
            proxima_atualizacao: newUpdateTime
          }).eq('id', 'andrea');
          
          setMessage(newMessage.mensagem);
        } else {
          // Exibir a mensagem atual
          const { data: message, error: messageError } = 
            await supabase.from('mensagens_motivacionais').select('mensagem').eq('id', lastViewed.mensagem_id).single();
          
          if (messageError) {
            // Fallback se não conseguir obter a mensagem atual
            const { data: randomMsg } = await supabase.from('mensagens_motivacionais')
              .select('mensagem').order('random()').limit(1).single();
            if (randomMsg) {
              setMessage(randomMsg.mensagem);
            } else {
              setMessage("Transformando unhas, elevando autoestima!");
            }
          } else {
            setMessage(message.mensagem);
          }
        }
      } catch (error) {
        console.error('Error fetching motivational message:', error);
        setMessage("Transformando unhas, elevando autoestima!");
      }
    };
    
    fetchMotivationalMessage();
    
    // Set up an interval to check for updates every hour
    const interval = setInterval(fetchMotivationalMessage, 3600000); // 1 hour in milliseconds
    
    return () => clearInterval(interval);
  }, []);

  if (!message) return null;

  return (
    <Card className="bg-rose-50 border-rose-100 shadow-soft">
      <CardContent className="p-6 text-center py-[16px] px-[10px]">
        <p className="text-rose-700 text-lg font-medium italic">
          "{message}"
        </p>
      </CardContent>
    </Card>
  );
};
