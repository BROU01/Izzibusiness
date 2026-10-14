import { apiData, internalError, requireProfile } from '@/lib/api-response';

// GET - Missions ouvertes + soumissions du membre connecté.
export async function GET() {
  try {
    const auth = await requireProfile();
    if (auth.response) return auth.response;

    const [missions, submissions] = await Promise.all([
      auth.supabase
        .from('missions')
        .select('id, title, description, proof_instructions, reward, created_at')
        .eq('status', 'open')
        .order('created_at', { ascending: false }),
      auth.supabase
        .from('mission_submissions')
        .select('id, mission_id, status, admin_note, created_at')
        .eq('user_id', auth.user.id),
    ]);
    if (missions.error) return internalError('missions GET', missions.error);

    return apiData({
      isMember: auth.profile.isMember,
      missions: (missions.data ?? []).map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        proofInstructions: m.proof_instructions,
        reward: Number(m.reward),
      })),
      submissions: (submissions.data ?? []).map((s) => ({
        id: s.id,
        missionId: s.mission_id,
        status: s.status,
        note: s.admin_note,
        createdAt: s.created_at,
      })),
    });
  } catch (error) {
    return internalError('missions GET', error);
  }
}
