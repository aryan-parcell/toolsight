import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, State, signIn, section, pass, fail, info } from '../helpers';

export const run = async () => {
  section("2. INVENTORY ISOLATION");

  const alphaBoxId = `box_alpha_${State.runId}`;
  const betaBoxId = `box_beta_${State.runId}`;

  // 1. Setup: Admins create their own boxes
  await signIn(State.users.find((u: any) => u.email.includes('admin-alpha')).email);
  await setDoc(doc(db, 'toolboxes', alphaBoxId), {
    name: 'Alpha Box', organizationId: State.alphaId
  });
  State.docs.push(`toolboxes/${alphaBoxId}`);

  await signIn(State.users.find((u: any) => u.email.includes('admin-beta')).email);
  await setDoc(doc(db, 'toolboxes', betaBoxId), {
    name: 'Beta Box', organizationId: State.betaId
  });
  State.docs.push(`toolboxes/${betaBoxId}`);


  // 2. TEST: Alpha Admin reading Beta Box
  info("Test: Alpha Admin reading Beta Box...");
  await signIn(State.users.find((u: any) => u.email.includes('admin-alpha')).email);
  try {
    await getDoc(doc(db, 'toolboxes', betaBoxId));
    fail("Alpha Admin WAS ABLE to read Beta Box!");
  } catch (e: any) {
    if (e.code === 'permission-denied') pass("Alpha Admin blocked from Beta Box");
    else throw e;
  }

  // 3. TEST: Alpha Maintainer reading Beta Box
  info("Test: Alpha Maintainer reading Beta Box...");
  await signIn(State.users.find((u: any) => u.email.includes('maintainer-alpha')).email);
  try {
    await getDoc(doc(db, 'toolboxes', betaBoxId));
    fail("Alpha Maintainer WAS ABLE to read Beta Box!");
  } catch (e: any) {
    if (e.code === 'permission-denied') pass("Alpha Maintainer blocked from Beta Box");
    else throw e;
  }

  // 4. TEST: Alpha Maintainer DELETING Alpha Box (RBAC Check)
  info("Test: Alpha Maintainer deleting their own box...");
  try {
    await deleteDoc(doc(db, 'toolboxes', alphaBoxId));
    fail("Maintainer WAS ABLE to delete toolbox!");
  } catch (e: any) {
    if (e.code === 'permission-denied') pass("Maintainer blocked from deleting");
    else throw e;
  }

  // 5. TEST: Maintainer Renaming Alpha Box (Should Fail)
  info("Test: Maintainer trying to rename toolbox...");
  await signIn(State.users.find((u: any) => u.email.includes('maintainer-alpha')).email);
  try {
    await setDoc(doc(db, 'toolboxes', alphaBoxId), { name: 'Hacked Name' }, { merge: true });
    fail("Maintainer WAS ABLE to rename toolbox!");
  } catch (e: any) {
    if (e.code === 'permission-denied') pass("Maintainer blocked from updating toolbox");
    else throw e;
  }

  // 6. TEST: Admin Renaming Alpha Box (Should Pass)
  info("Test: Admin renaming toolbox...");
  await signIn(State.users.find((u: any) => u.email.includes('admin-alpha')).email);
  try {
    await setDoc(doc(db, 'toolboxes', alphaBoxId), { name: 'Alpha Box Renamed' }, { merge: true });
    pass("Admin successfully renamed toolbox");
  } catch (e: any) {
    fail("Admin failed to rename toolbox: " + e.message);
  }
};