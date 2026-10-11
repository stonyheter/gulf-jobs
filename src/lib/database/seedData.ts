/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SEED_USERS: Dev fallback for UserRepository (production uses Supabase Auth).
 * SEED_COMPANIES: Dev fallback for CompanyRepository (production uses Supabase).
 */

import { User } from '../../types/auth';
import { Company } from '../../types/company';

export const SEED_USERS: User[] = [
  {
    id: 'd0e8b1a2-3c4d-4e5f-a6b7-c8d9e0f1a2b3',
    email: 'faisal.shammari@example.com',
    displayName: 'فيصل عبدالرحمن الشمري',
    role: 'job_seeker',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'e1f2a3b4-5c6d-7e8f-9a0b-1c2d3e4f5a6b',
    email: 'recruiter.aramco@example.com',
    displayName: 'عبدالله القحطاني (مسؤول التوظيف)',
    role: 'employer',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'f2a3b4c5-6d7e-8f9a-0b1c-2d3e4f5a6b7c',
    email: 'admin@gulfjobs.internal',
    displayName: 'مشرف المنصة العام (Admin)',
    role: 'admin',
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
];



export const SEED_COMPANIES: Company[] = [
  {
    id: 'comp-aramco',
    ownerUserId: 'e1f2a3b4-5c6d-7e8f-9a0b-1c2d3e4f5a6b',
    name: 'أرامكو السعودية',
    logo: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=128&auto=format&fit=crop&q=80',
    description: 'إحدى الشركات الرائدة عالمياً في مجال الطاقة والكيميائيات.',
    website: 'https://www.aramco.com',
    country: 'المملكة العربية السعودية',
    region: 'المنطقة الشرقية',
    city: 'الظهران',
    address: 'المجمع الرئيسي، الظهران',
    verified: true,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'comp-sabic',
    ownerUserId: 'e1f2a3b4-5c6d-7e8f-9a0b-1c2d3e4f5a6b',
    name: 'سابك (SABIC)',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128&auto=format&fit=crop&q=80',
    description: 'شركة صناعية عالمية رائدة في تصنيع الكيماويات المتنوعة.',
    website: 'https://www.sabic.com',
    country: 'المملكة العربية السعودية',
    region: 'منطقة الرياض',
    city: 'الرياض',
    address: 'حي قرطبة، الرياض',
    verified: true,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'comp-stc',
    ownerUserId: 'f2a3b4c5-6d7e-8f9a-0b1c-2d3e4f5a6b7c',
    name: 'مجموعة stc',
    logo: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=128&auto=format&fit=crop&q=80',
    description: 'الممكن الرقمي الرائد في منطقة الشرق الأوسط وشمال أفريقيا.',
    website: 'https://www.stc.com.sa',
    country: 'المملكة العربية السعودية',
    region: 'منطقة الرياض',
    city: 'الرياض',
    address: 'مجمع الملك عبدالعزيز للاتصالات، الرياض',
    verified: true,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'comp-emirates',
    ownerUserId: 'f2a3b4c5-6d7e-8f9a-0b1c-2d3e4f5a6b7c',
    name: 'مجموعة طيران الإمارات',
    logo: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=128&auto=format&fit=crop&q=80',
    description: 'مجموعة طيران عالمية تقدم خدمات السفر والضيافة بأعلى معايير التميز.',
    website: 'https://www.emirates.com',
    country: 'الإمارات العربية المتحدة',
    region: 'إمارة دبي',
    city: 'دبي',
    address: 'مقر مجموعة الإمارات، القرهود، دبي',
    verified: true,
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-09-01T08:00:00.000Z',
  },
];
