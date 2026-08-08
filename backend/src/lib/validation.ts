import { z } from 'zod'

export const CityQuerySchema = z.object({
  city: z.string().min(1, 'City required').max(100, 'City too long'),
})

export const ForecastQuerySchema = z.object({
  city: z.string().min(1, 'City required').max(100, 'City too long'),
  days: z.coerce.number().int().min(1).max(5).default(1),
})

export const TurbulencePredictSchema = z.object({
  from: z.string().min(1, 'From city required').max(100),
  to: z.string().min(1, 'To city required').max(100),
  altitude: z.coerce.number().int().min(5000, 'Min altitude 5000ft').max(50000, 'Max altitude 50000ft'),
  time: z.string().datetime().optional(),
})

export const SaveLocationSchema = z.object({
  city: z.string().min(1, 'City required').max(100),
  label: z.string().min(1, 'Label required').max(200),
})
