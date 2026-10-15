import { apiData, internalError, requireProfile } from '@/lib/api-response';
import { query } from '@/lib/db';

interface MissionRow {
  id: string;
  title: string;
  description: string;
  proof_instructions: string;
  reward: number;
}

interface SubmissionRow {
  id: string;
  mission_id: string;
  status: string;
  admin_note: string | null;
  created_at: Date;
}

// GET - Missions ouvertes + soumissions du membre connecté.
export async function GET() {
  try {
    const auth = await requireProfile();
    if (auth.response) return auth.response;

    const [missions, submissions] = await Promise.all([
      query<MissionRow>(
        `select id, title, description, proof_instructions, reward::float8 as reward
           from missions
          where status = 'open'
          order by created_at desc`,
      ),
      query<SubmissionRow>(
        `select id, mission_id, status, admin_note, created_at
           from mission_submissions
          where user_id = $1`,
        [auth.user.id],
      ),
    ]);

    return apiData({
      isMember: auth.profile.isMember,
      missions: missions.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        proofInstructions: m.proof_instructions,
        reward: Number(m.reward),
      })),
      submissions: submissions.map((s) => ({
        id: s.id,
        missionId: s.mission_id,
        status: s.status,
        note: s.admin_note,
        createdAt: s.created_at.toISOString(),
      })),
    });
  } catch (error) {
    return internalError('missions GET', error);
  }
}
