import { auth } from "@/lib/auth";
import { logger } from "@/lib/utils/logger";

export async function getCurrentUser() {
  try {
    const session = await auth();
    return session?.user;
  } catch (error) {
    logger.error("Error getting current user", error);
    return null;
  }
}

export async function requireAuth() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }
    return user;
  } catch (error) {
    logger.error("Auth requirement error", error);
    throw error;
  }
}
