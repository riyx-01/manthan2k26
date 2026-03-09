import { z } from 'zod';

const teamMemberSchema = z.object({
    name: z
        .string()
        .min(2, 'Member name must be at least 2 characters')
        .max(100, 'Member name must be less than 100 characters')
        .trim(),
});

const teamRegistrationSchema = z.object({
    event_id: z.string().min(1, 'Invalid team event ID'),
    team_name: z
        .string()
        .trim()
        .max(100, 'Team name must be less than 100 characters')
        .nullable()
        .optional()
        .or(z.literal('')),
    team_size: z
        .number({ invalid_type_error: 'Team size must be a number' })
        .int('Team size must be a whole number')
        .min(1, 'Team size must be at least 1')
        .max(50, 'Team size must be less than or equal to 50'),
    members: z.array(teamMemberSchema).max(49, 'Too many team members provided'),
});

export const registrationSchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be less than 100 characters')
        .trim(),
    email: z
        .string()
        .email('Invalid email address')
        .max(255, 'Email must be less than 255 characters'),
    phone: z
        .string()
        .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
    college: z
        .string()
        .min(2, 'College name must be at least 2 characters')
        .max(200, 'College name must be less than 200 characters'),
    year: z
        .string()
        .min(1, 'Please select your year'),
    department: z
        .string()
        .min(1, 'Please enter your department')
        .max(100, 'Department must be less than 100 characters'),
    event_ids: z
        .array(z.string().min(1, 'Invalid event ID'))
        .min(1, 'Select at least one event')
        .max(12, 'Cannot select more than 12 events'),
    team_registrations: z
        .array(teamRegistrationSchema)
        .max(12, 'Cannot submit team details for more than 12 events')
        .optional()
        .default([]),
});

export const paymentVerificationSchema = z.object({
    razorpay_order_id: z.string().min(1, 'Order ID is required'),
    razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
    razorpay_signature: z.string().min(1, 'Signature is required'),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type PaymentVerificationInput = z.infer<typeof paymentVerificationSchema>;
