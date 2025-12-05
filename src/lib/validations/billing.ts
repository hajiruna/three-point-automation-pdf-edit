/**
 * 課金API用バリデーションスキーマ
 */

import { z } from 'zod/v4'

/**
 * Checkout APIリクエストスキーマ
 */
export const checkoutRequestSchema = z.object({
  priceId: z
    .string()
    .min(1, 'Price ID is required')
    .regex(/^price_/, 'Invalid price ID format'),
  successUrl: z
    .string()
    .url('Invalid success URL format')
    .optional(),
  cancelUrl: z
    .string()
    .url('Invalid cancel URL format')
    .optional(),
})

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>

/**
 * Usage記録APIリクエストスキーマ
 */
export const usageRecordRequestSchema = z.object({
  operationType: z.enum(['extract', 'merge'], {
    message: 'Operation type must be "extract" or "merge"',
  }),
  pageCount: z
    .number()
    .int({ message: 'Page count must be an integer' })
    .min(0, 'Page count must be non-negative'),
})

export type UsageRecordRequest = z.infer<typeof usageRecordRequestSchema>

/**
 * バリデーションエラーをフォーマット
 */
export function formatZodError(error: z.ZodError): string {
  return error.issues.map(e => e.message).join(', ')
}
