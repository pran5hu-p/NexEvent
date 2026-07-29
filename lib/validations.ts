import { z } from 'zod';

// --- EVENT SCHEMAS ---
export const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description is too short'),
  category: z.string().min(2, 'Category is required'),
  // z.coerce turns the incoming string into a Date object automatically before checking
  date: z.coerce.date().refine((date) => date > new Date(), {
    message: 'Event date cannot be in the past',
  }),
  location: z.string().min(3, 'Location is required'),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
  tags: z.array(z.string()).optional(),
  posterUrl: z.string().url().optional(),
});

export const updateEventStatusSchema = z.object({
  status: z.enum(['approved', 'rejected', 'pending']),
});

// --- REGISTRATION SCHEMAS ---
export const createRegistrationSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
});

export const checkInSchema = z.object({
  registrationId: z.string().min(1, 'Registration ID is required'),
});

export const createReviewSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().optional(),
});

// 2. New Cancel Registration Schema
export const cancelRegistrationSchema = z.object({
  registrationId: z.string().min(1, 'Registration ID is required'),
});

// 3. New Update Event Schema (Makes all fields from createEventSchema optional)
export const updateEventSchema = createEventSchema.partial();

// --- USER PROFILE SCHEMAS ---
export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  avatarUrl: z.string().url('Invalid URL').optional(),
});