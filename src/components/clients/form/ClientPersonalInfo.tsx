
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface ClientPersonalInfoProps {
  name: string;
  setName: (name: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  email: string;
  setEmail: (email: string) => void;
  birthdate: string;
  setBirthdate: (birthdate: string) => void;
  errors: Record<string, string>;
  formatPhoneInput: (value: string) => string;
}

export function ClientPersonalInfo({
  name,
  setName,
  phone,
  setPhone,
  email,
  setEmail,
  birthdate,
  setBirthdate,
  errors,
  formatPhoneInput
}: ClientPersonalInfoProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input 
          id="name"
          placeholder="Nome completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone *</Label>
        <Input 
          id="phone"
          placeholder="(00) 00000-0000"
          value={phone}
          onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
          required
          className={errors.phone ? "border-destructive" : ""}
        />
        {errors.phone && <p className="text-destructive text-sm">{errors.phone}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email"
          type="email"
          placeholder="email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="birthdate">Data de Nascimento</Label>
        <Input 
          id="birthdate"
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
        />
      </div>
    </>
  );
}
