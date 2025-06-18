// src/lib/validations/forms.ts
import { z } from 'zod'

export const arquitectoDecisionesSchema = z.object({
  contextoDecision: z
    .string()
    .min(50, 'Describe tu decisión con al menos 50 caracteres')
    .max(1000, 'Máximo 1000 caracteres'),
  timeline: z.enum(['urgente', '2-4-semanas', '1-2-meses', 'flexible'], {
    required_error: 'Selecciona un timeline',
  }),
  alternativas: z
    .array(z.string().min(1, 'La alternativa no puede estar vacía'))
    .min(2, 'Debes tener al menos 2 alternativas')
    .max(6, 'Máximo 6 alternativas'),
  criterios: z
    .array(z.string().min(1, 'El criterio no puede estar vacío'))
    .min(3, 'Debes tener al menos 3 criterios')
    .max(8, 'Máximo 8 criterios'),
  informacionFaltante: z
    .string()
    .min(20, 'Describe qué información te falta con al menos 20 caracteres')
    .max(500, 'Máximo 500 caracteres'),
  contextoPersonal: z
    .string()
    .max(300, 'Máximo 300 caracteres')
    .optional(),
})

export type ArquitectoDecisionesFormData = z.infer<typeof arquitectoDecisionesSchema>
