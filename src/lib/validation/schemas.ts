import { z } from 'zod';

import { LIMITS } from '@/constants/limits';
import { validateUsername } from '@/lib/domain/username';

const requiredText = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters.`)
    .max(max, `${label} must be at most ${max} characters.`);

export const scriptureReferenceSchema = z.object({
  raw: z.string().min(1).max(80),
  book: z.string().min(1).max(40),
  bookId: z.string().min(1).max(40),
  chapter: z.number().int().positive(),
  verseStart: z.number().int().positive(),
  verseEnd: z.number().int().positive(),
});

export const signUpSchema = z
  .object({
    email: z.email('Enter a valid email.'),
    password: z.string().min(8, 'Use at least 8 characters.').max(72, 'Use at most 72 characters.'),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export const signInSchema = z.object({
  email: z.email('Enter a valid email.'),
  password: z.string().min(1, 'Enter your password.').max(72),
});

export const usernameSchema = z
  .object({
    username: z.string().trim(),
    displayName: z.string().trim().max(LIMITS.displayName, `Display name must be at most ${LIMITS.displayName} characters.`),
  })
  .superRefine((value, ctx) => {
    const message = validateUsername(value.username);
    if (message) ctx.addIssue({ code: 'custom', path: ['username'], message });
  });

export const profileSchema = z.object({
  displayName: z.string().trim().max(LIMITS.displayName, `Display name must be at most ${LIMITS.displayName} characters.`),
  bio: z.string().trim().max(LIMITS.bio, `Bio must be at most ${LIMITS.bio} characters.`),
  username: z.string().trim(),
}).superRefine((value, ctx) => {
  const message = validateUsername(value.username);
  if (message) ctx.addIssue({ code: 'custom', path: ['username'], message });
});

export const postSchema = z.object({
  communityId: z.uuid('Choose a community.'),
  type: z.enum(['question', 'discussion', 'testimony', 'prayer_request']),
  title: requiredText(LIMITS.titleMin, LIMITS.titleMax, 'Title'),
  body: requiredText(1, LIMITS.bodyMax, 'Body'),
  scriptureReferences: z.array(scriptureReferenceSchema).max(LIMITS.scripturePerPost),
});

export const commentSchema = z.object({
  body: requiredText(1, LIMITS.commentMax, 'Comment'),
  scriptureReferences: z.array(scriptureReferenceSchema).max(LIMITS.scripturePerPost),
});

export const reportSchema = z.object({
  reason: z.enum(['harassment', 'hate_or_threats', 'spam_or_scam', 'personal_information', 'other']),
  details: z.string().trim().max(LIMITS.reportDetails, `Details must be at most ${LIMITS.reportDetails} characters.`),
});

export const passwordSchema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters.').max(72),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export type SignUpValues = z.infer<typeof signUpSchema>;
export type SignInValues = z.infer<typeof signInSchema>;
export type UsernameValues = z.infer<typeof usernameSchema>;
export type ProfileValues = z.infer<typeof profileSchema>;
export type PostValues = z.infer<typeof postSchema>;
export type CommentValues = z.infer<typeof commentSchema>;
export type ReportValues = z.infer<typeof reportSchema>;
