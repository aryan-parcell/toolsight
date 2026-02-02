import { doc, setDoc } from 'firebase/firestore';
import { db, State, signIn, section, pass, fail, info } from '../helpers';

export const run = async () => {
  section("3. CHECKOUT PERMISSIONS");

  const alphaBoxId = `box_alpha_${State.runId}`;
  const checkoutId = `checkout_${State.runId}`;
  const maintainer = State.users.find((u: any) => u.email.includes('maintainer-alpha'));
  const admin = State.users.find((u: any) => u.email.includes('admin-alpha'));
  const betaAdmin = State.users.find((u: any) => u.email.includes('admin-beta'));

  // 1. TEST: Alpha Admin trying to checkout
  info("Test: Alpha Admin attempting checkout...");
  await signIn(admin.email);
  try {
    await setDoc(doc(db, 'checkouts', `fail_checkout_${State.runId}`), {
      toolboxId: alphaBoxId,
      userId: admin.uid,
      organizationId: State.alphaId,
      status: 'active'
    });
    fail("Admin WAS ABLE to checkout (Should be blocked)!");
  } catch (e: any) {
    if (e.code === 'permission-denied') pass("Admin blocked from checkout (Correct)");
    else throw e;
  }

  // 2. TEST: Beta Admin trying to checkout Alpha Box
  info("Test: Beta Admin attempting hostile checkout...");
  await signIn(betaAdmin.email);
  try {
    await setDoc(doc(db, 'checkouts', `hostile_checkout_${State.runId}`), {
      toolboxId: alphaBoxId,
      userId: betaAdmin.uid,
      organizationId: State.betaId, // Mismatch!
      status: 'active'
    });
    fail("Beta Admin WAS ABLE to checkout Alpha Box!");
  } catch (e: any) {
    if (e.code === 'permission-denied') pass("Cross-Org checkout blocked");
    else throw e;
  }

  // 3. TEST: Alpha Maintainer Success
  info("Test: Alpha Maintainer standard checkout...");
  await signIn(maintainer.email);
  await setDoc(doc(db, 'checkouts', checkoutId), {
    toolboxId: alphaBoxId,
    userId: maintainer.uid,
    organizationId: State.alphaId,
    status: 'active'
  });
  State.docs.push(`checkouts/${checkoutId}`);
  pass("Maintainer successfully created checkout");

  // 4. TEST: Maintainer Closing the Checkout (Update Flow)
  info("Test: Alpha Maintainer closing the checkout...");
  await signIn(maintainer.email);
  try {
    // We update status to 'complete' and set a return time
    // This tests: allow update: if belongsToOrg(resource.data) && belongsToOrg(request.resource.data);
    await setDoc(doc(db, 'checkouts', checkoutId), {
      status: 'complete',
      returnTime: new Date().toISOString()
    }, { merge: true });
    pass("Maintainer successfully closed checkout");
  } catch (e: any) {
    fail("Maintainer failed to close checkout: " + e.message);
  }

  // 5. TEST: Maintainer trying to hijack checkout during update
  info("Test: Maintainer trying to change Org ID during close...");
  try {
    await setDoc(doc(db, 'checkouts', checkoutId), {
      organizationId: State.betaId // <--- ATTACK
    }, { merge: true });
    fail("Security Breach! User changed Org ID on update.");
  } catch (e: any) {
    if (e.code === 'permission-denied') pass("Org ID change blocked on update");
    else throw e;
  }
};