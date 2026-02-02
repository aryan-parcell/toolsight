import { deleteDoc, doc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth, State, signIn, section, pass, info } from '../helpers';

export const run = async () => {
  section("6. CLEANUP");

  for (const user of State.users) {
    try {
      await signIn(user.email);
      const currentUser = auth.currentUser;
      if (currentUser) {
        await deleteUser(currentUser);
        info(`Deleted Auth User: ${user.email}`);
      }
    } catch (e) {
      console.warn(`Could not delete user ${user.email}:`, e);
    }
  }

  pass("Cleanup complete (Auth Users deleted). Firestore docs may remain if Admin SDK not used.");
};