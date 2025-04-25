
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";

export const MotivationalMessage = () => {
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const fetchMotivationalMessage = async () => {
      try {
        const { data: lastViewed, error: lastViewedError } = 
          await supabase.from('ultima_mensagem_vista').select('*').eq('id', 'andrea').single();

        if (lastViewedError) {
          console.error('Error fetching last viewed message:', lastViewedError);
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
        const nextUpdateTime = parseISO(lastViewed.proxima_atualizacao);
        
        if (now >= nextUpdateTime) {
          const { data: newMessage, error: messageError } = 
            await supabase.from('mensagens_motivacionais').select('*').order('random()').limit(1).single();
          if (messageError) throw messageError;
          
          await supabase.from('ultima_mensagem_vista').update({
            mensagem_id: newMessage.id,
            data_visualizacao: now.toISOString(),
            proxima_atualizacao: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString()
          }).eq('id', 'andrea');
          
          setMessage(newMessage.mensagem);
        } else {
          const { data: message, error: messageError } = 
            await supabase.from('mensagens_motivacionais').select('mensagem').eq('id', lastViewed.mensagem_id).single();
          
          if (messageError) {
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
