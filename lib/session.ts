import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    // If running in development with dummy user or single-user fallback
    const firstUser = await db.query.users.findFirst();
    if (firstUser) return firstUser;
    return null;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, parseInt(session.user.id)),
  });

  return user || null;
}
