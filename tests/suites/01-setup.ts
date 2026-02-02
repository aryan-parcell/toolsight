import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, State, saveState, section, pass, info } from '../helpers';

export const run = async () => {
  section("1. SETUP: WORLD GENERATION");

  const createTestUser = async (role: string, orgName: string, orgId: string) => {
    const email = `${role}-${orgName}-${State.runId}@test.com`;
    const password = 'password123';

    // 1. Create the Auth User
    // This automatically signs us in as the new user
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    // Save to state for cleanup/later tests
    State.users.push({ email, uid, password });

    // 2. Write the User Profile (Self-Creation)
    // Rule: allow create: if isSignedIn() && request.auth.uid == userId;
    // We are signed in as 'uid', writing to 'users/uid'. This should pass.
    await setDoc(doc(db, 'users', uid), {
      email,
      role,
      organizationId: orgId
    });
    info(`Created User Profile: ${email}`);

    // 3. If this is an Admin, they also need to create the Organization
    // Rule: allow create: if isSignedIn();
    if (role === 'admin') {
      // Only create the org doc if it doesn't exist (avoid overwrites if multiple admins)
      // But for this test, we create it once per Admin.
      await setDoc(doc(db, 'organizations', orgId), { name: `${orgName} Corp` });
      info(`Created Org: ${orgId}`);
      State.docs.push(`organizations/${orgId}`);
    }

    State.docs.push(`users/${uid}`);

    // 4. Sign out to clean state for next iteration
    await signOut(auth);

    return cred.user;
  };

  // --- EXECUTION ---

  // 1. Define Org IDs
  const alphaId = `org_alpha_${State.runId}`;
  const betaId = `org_beta_${State.runId}`;

  State.alphaId = alphaId;
  State.betaId = betaId;

  // 2. Create Alpha Admin (Creates User + Alpha Org)
  await createTestUser('admin', 'alpha', alphaId);

  // 3. Create Beta Admin (Creates User + Beta Org)
  await createTestUser('admin', 'beta', betaId);

  // 4. Create Alpha Maintainer (Creates User only - joins Alpha)
  await createTestUser('maintainer', 'alpha', alphaId);

  pass(`Created 2 Orgs & 3 Users (Suffix: ${State.runId})`);
  saveState();
};