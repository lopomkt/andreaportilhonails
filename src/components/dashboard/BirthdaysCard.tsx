
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gift, Cake } from "lucide-react"
import { Client } from "@/types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface BirthdaysCardProps {
  clients: Client[]
}

export function BirthdaysCard({ clients }: BirthdaysCardProps) {
  const today = new Date()
  const currentMonth = today.getMonth()
  
  const birthdays = clients.filter(client => {
    if (!client.birthdate) return false
    const birthDate = new Date(client.birthdate)
    return birthDate.getMonth() === currentMonth
  }).sort((a, b) => {
    const dateA = new Date(a.birthdate!)
    const dateB = new Date(b.birthdate!)
    return dateA.getDate() - dateB.getDate()
  })

  const createWhatsAppMessage = (client: Client) => {
    const message = `Olá ${client.name}! 🎉 Feliz Aniversário! 🎂 Desejo a você um dia muito especial, cheio de alegria e realizações. Agradeço por fazer parte da minha história! 💝 Andrea Portilho - Nail Design`
    const encodedMessage = encodeURIComponent(message)
    const phoneNumber = client.phone.replace(/\D/g, '')
    return `https://wa.me/55${phoneNumber}?text=${encodedMessage}`
  }

  return (
    <Card className="bg-white border-rose-100 shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="text-rose-700 flex items-center text-base font-bold">
          <Gift className="mr-2 h-4 w-4 text-rose-600" />
          Aniversariantes do Mês
        </CardTitle>
      </CardHeader>
      <CardContent>
        {birthdays.length > 0 ? (
          <div className="space-y-3">
            {birthdays.map(client => (
              <div key={client.id} className="flex items-center justify-between p-2 bg-rose-50 rounded-lg">
                <div>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(client.birthdate!), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => window.open(createWhatsAppMessage(client), '_blank')}
                >
                  Enviar Mensagem
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Cake className="h-12 w-12 text-rose-300 mb-2" />
            <p className="font-medium text-lg text-rose-700">Sem aniversariantes do mês 🎂</p>
            <p className="text-sm text-muted-foreground mt-1">
              Quando seus clientes fizerem aniversário, eles aparecerão aqui! 🎉
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
