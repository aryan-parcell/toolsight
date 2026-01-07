# **Firebase Functions Deployment Checklist**

**Purpose:** Ensure all prerequisites, permissions, and resources are correctly configured for smooth Firebase Function deployment.

---

## **1. Project Initialization**

* ✅ **Enable Firebase in the project**

  * Run: `firebase init` and select Functions.
  * Choose Node.js for language (v18+ recommended for Functions v2).

* ✅ **Enable Google App Engine**

  * Navigate to Cloud Console → App Engine → Create Application.
  * Select a **region** for your App Engine app (even if you won’t use App Engine directly).
  * **Why:** Cloud Functions rely on some legacy App Engine infrastructure. Missing App Engine can cause authentication errors.

* ✅ **Enable required APIs**

  * Firebase Functions depends on several GCP APIs:

    * **Cloud Functions API**
    * **Cloud Build API**
    * **Cloud Run API**
    * **Eventarc API**
  * Verify in Cloud Console → APIs & Services → Enabled APIs & Services.

---

## **2. Service Accounts**

### **a. gcf-admin-robot (Google-managed service agent)**

* Check IAM → Include Google-provided role grants → Search for `gcf-admin-robot`.
* Must have the role: **Cloud Functions Service Agent**
* **Purpose:** Performs administrative tasks for Cloud Functions (create/update/delete).

---

### **b. Compute Engine default service account (`<PROJECT_NUMBER>-compute@developer.gserviceaccount.com`)**

* Verify this account exists in IAM.
* Assign roles:

  * **Cloud Run Builder (`roles/run.builder`)** → Needed to build and containerize Functions via Cloud Build.
  * **Cloud Run Invoker** → Optional, needed if Functions call Cloud Run services.
  * **Editor** → Optional, for broad access to project resources.
  * **Eventarc Event Receiver** → Required if using Eventarc triggers.

---

### **c. Your user account (e.g., work email)**

* Needs permissions to deploy:

  * `Owner` or `Editor` role is sufficient.
* **Note:** Actual build/deployment uses service accounts, not your user account.

---

## **3. IAM and Role Propagation**

* After modifying service accounts or roles, **wait ~5–30 minutes** for changes to propagate across Google Cloud.
* Deployment errors can occur if IAM updates haven’t fully applied.

---

## **4. Firebase Functions Folder Setup**

* Ensure your function code is in `functions/src` or `functions` depending on setup.
* Correct `package.json` scripts:

  ```json
  "scripts": {
    "build": "tsc",
    "lint": "eslint --ext .js,.ts .",
    "deploy": "firebase deploy --only functions"
  }
  ```
* Ensure Node.js version matches Firebase Functions requirements (v18+ for Functions v2).

---

## **5. Linting & TypeScript**

* Run `npm run lint` to fix common errors/warnings.
* Avoid `any` types where possible; use proper TypeScript typing.
* Use `tsconfig.json` compatible with Firebase Functions:

  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "module": "commonjs",
      "lib": ["ES2020"],
      "strict": true,
      "esModuleInterop": true,
      "outDir": "lib"
    },
    "include": ["src"]
  }
  ```

---

## **6. Function Deployment**

1. **Build code:**

   ```bash
   npm run build
   ```

2. **Deploy functions:**

   ```bash
   firebase deploy --only functions
   ```

3. **Verify logs:**

   * Check Firebase Console → Functions → Logs for errors.
   * Common errors:

     * `Could not authenticate gcf-admin-robot` → Service account issue.
     * `Permission denied storage.buckets.get` → Eventarc / Storage permissions.

---

## **7. Troubleshooting Common Issues**

| Error                                    | Likely Cause                                 | Fix                                                                                           |
| ---------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `Could not authenticate gcf-admin-robot` | App Engine missing / service account missing | Create App Engine app, ensure service agent exists and has Cloud Functions Service Agent role |
| `Permission storage.buckets.get denied`  | Eventarc or Cloud Storage permissions        | Check `Eventarc Event Receiver` role for Compute Engine default SA                            |
| `Cloud Build failed`                     | Compute Engine SA missing Cloud Run Builder  | Add `roles/run.builder` to `<PROJECT_NUMBER>-compute@developer.gserviceaccount.com`           |
| `Function path invalid`                  | Incorrect storage bucket or folder structure | Ensure image files or triggers follow expected path (e.g., `audits/{auditId}/{drawerId}.jpg`) |

---

## **8. Optional: Service Account Debug Commands**

* List all service accounts:

```bash
gcloud iam service-accounts list --project <PROJECT_ID>
```

* Undelete a deleted service account:

```bash
gcloud beta iam service-accounts undelete <SA_EMAIL>
```

* Grant role to service account:

```bash
gcloud projects add-iam-policy-binding <PROJECT_ID> \
  --member=serviceAccount:<SA_EMAIL> \
  --role=roles/<ROLE>
```

---

✅ **By following this checklist, you ensure:**

1. The project infrastructure is initialized properly.
2. All service accounts have correct roles.
3. IAM changes propagate before deploying.
4. Firebase Functions deploy smoothly without authentication or build errors.