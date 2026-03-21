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

export const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function getMonthName(month: number): string {
  return MONTHS_PT[month - 1]
}

export function getCurrentMonthYear() {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

export const OBJECTIVE_LABELS: Record<string, string> = {
  engajamento: '💬 Engajamento',
  conversão:   '🎯 Conversão',
  autoridade:  '🏆 Autoridade',
  humanização: '❤️ Humanização',
  alcance:     '📡 Alcance',
}

export const FORMAT_LABELS: Record<string, string> = {
  reels:     '🎬 Reels',
  carrossel: '📄 Carrossel',
  estático:  '🖼️ Estático',
  stories:   '⏳ Stories',
}

export const OBJECTIVE_COLORS: Record<string, string> = {
  engajamento: 'bg-blue-50 text-blue-600',
  conversão:   'bg-green-50 text-green-600',
  autoridade:  'bg-violet-50 text-violet-600',
  humanização: 'bg-pink-50 text-pink-600',
  alcance:     'bg-amber-50 text-amber-600',
}
