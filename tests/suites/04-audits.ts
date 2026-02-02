import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db, State, signIn, section, pass, fail, info } from '../helpers';

export const run = async () => {
  section("4. AUDIT SECURITY");

  // We rely on the checkout created in Module 3
  // If running standalone, we'd need to recreate it, but we assume the state file has it.
  const checkoutId = `checkout_${State.runId}`;
  const auditId = `audit_${State.runId}`;

  const maintainer = State.users.find((u: any) => u.email.includes('maintainer-alpha'));
  const betaAdmin = State.users.find((u: any) => u.email.includes('admin-beta'));

  // 1. TEST: Maintainer creates an Audit (Positive Case)
  info("Test: Alpha Maintainer creating audit...");
  await signIn(maintainer.email);

  try {
    // Note: The App code would usually derive organizationId.
    // But since we are using Client SDK raw writes, we MUST provide it manually
    // to pass the `belongsToOrg(request.resource.data)` rule.
    await setDoc(doc(db, 'audits', auditId), {
      checkoutId: checkoutId,
      organizationId: State.alphaId, // Critical: Must match User's Org
      status: 'active',
      drawerStates: {}
    });
    State.docs.push(`audits/${auditId}`);
    pass("Audit created successfully");
  } catch (e: any) {
    fail("Maintainer failed to create audit: " + e.message);
  }

  // 2. TEST: Beta Admin reading Alpha Audit (The Wall)
  info("Test: Beta Admin attempting to spy on Alpha audits...");
  await signIn(betaAdmin.email);

  try {
    await getDoc(doc(db, 'audits', auditId));
    fail("Security Breach! Beta Admin read Alpha Audit.");
  } catch (e: any) {
    if (e.code === 'permission-denied') pass("Cross-Org audit read blocked");
    else throw e;
  }

  // 3. TEST: Integrity Check (Org Injection)
  // Can the maintainer edit the audit to "move" it to another org?
  // This tests the `orgIdUnchanged()` or `belongsToOrg` update rules.
  info("Test: Alpha Maintainer trying to tamper with Org ID...");
  await signIn(maintainer.email);

  try {
    await updateDoc(doc(db, 'audits', auditId), {
      organizationId: State.betaId // Trying to move it to Beta
    });
    fail("Integrity Breach! User changed Audit Organization ID.");
  } catch (e: any) {
    if (e.code === 'permission-denied') pass("Audit Org ID tamper blocked");
    else throw e;
  }
};