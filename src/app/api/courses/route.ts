import { apiData, internalError, requireUser } from '@/lib/api-response';
import { query } from '@/lib/db';

/** Catalogue des formations publiées (utilisateur connecté). */

interface CourseRow {
  slug: string;
  title: string;
  description: string;
  duration_weeks: number;
  price_fcfa: string;
  level: string;
  category: string;
  image_url: string | null;
}

interface CourseDto {
  slug: string;
  title: string;
  description: string;
  durationWeeks: number;
  priceFcfa: number;
  level: string;
  category: string;
  imageUrl: string | null;
}

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const rows = await query<CourseRow>(
      `select slug, title, description, duration_weeks, price_fcfa, level, category, image_url
         from courses
        where is_published
        order by created_at desc, slug`,
    );
    const courses: CourseDto[] = rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      description: row.description,
      durationWeeks: row.duration_weeks,
      priceFcfa: Number(row.price_fcfa),
      level: row.level,
      category: row.category,
      imageUrl: row.image_url,
    }));
    return apiData({ courses });
  } catch (error) {
    return internalError('courses:get', error);
  }
}
