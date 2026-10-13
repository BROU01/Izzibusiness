import { internalError, requireUser } from '@/lib/api-response';
import { paymentsUnavailable } from '@/lib/payments-status';

// POST - Dépôt : suspendu jusqu'à l'intégration PayDunya (voir payments-status.ts).
export async function POST() {
  try {
    const auth = await requireUser();
    if (auth.response) return auth.response;
    return paymentsUnavailable();
  } catch (error) {
    return internalError('deposit POST', error);
  }
}
