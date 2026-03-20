import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const NICHE_LABELS: Record<string, string> = {
  'Moda e vestuário': 'Moda',
  'Gastronomia e alimentação': 'Gastronomia',
  'Beleza e estética': 'Beleza',
  'Fitness e saúde': 'Fitness',
  'Tecnologia': 'Tech',
  'Educação': 'Educação',
  'Casa e decoração': 'Casa',
  'Pets': 'Pets',
  'Turismo e viagem': 'Turismo',
  'Finanças e investimentos': 'Finanças',
  'Arte e cultura': 'Arte',
  'Varejo local': 'Varejo',
  'Serviços profissionais': 'Serviços',
  'Outro': 'Outro',
}
