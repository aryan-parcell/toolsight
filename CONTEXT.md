# ToolSight

ToolSight is a full-stack system designed to manage, track, and audit toolboxes across organizations. It provides security, accountability, and real-time visual tracking of maintenance assets through automated visual audits and strict custody tracking.

## Language

### Users & Boundaries

**Organization**:
A tenant or entity in the system representing an aviation squadron, maintenance unit, or commercial facility that owns toolboxes and templates.
_Avoid_: Company, tenant, customer, base, squadron

**Admin**:
An organization-level manager who configures toolboxes and templates, and manages maintainer invitations.
_Avoid_: Supervisor, manager, coordinator, officer

**Maintainer**:
An aircraft technician or maintenance specialist who checks out toolboxes, performs drawer audits, and returns toolboxes after use.
_Avoid_: Technician, mechanic, user, specialist

### Physical Assets

**Toolbox**:
A physical storage unit containing tools, scoped to an Organization, and divided into drawers. Its **EID** (Equipment ID) corresponds directly to its Firestore document ID and is used via manual entry or qr code scan for checkout. When a Toolbox is first created, an initial "clean state" synthetic Audit is immediately compiled alongside it, ensuring that its `lastAuditId` is never null.
_Avoid_: Box, chest, toolkit, serial number

**Drawer**:
A sliding compartment inside a Toolbox that holds a specific subset of tools.
_Avoid_: Shelf, tray, level

**Tool**:
An individual physical instrument located inside a specific Drawer, whose presence is verified during audits.
_Avoid_: Asset, item, device

**Template**:
A reference master layout of a drawer's correct state, detailing the name, boundary shape, rotation, and coordinate positions of all expected tools. Templates are reusable across multiple Toolboxes.
_Avoid_: Blueprint, layout, master, reference image

**Calibration Management**:
An ideated, low-priority feature designed to track and enforce calibration schedules for precision tools (e.g., torque wrenches). This feature is currently **not implemented** in the active codebase.
_Avoid_: Certification, maintenance scheduling, tool tuning

### Checkout & Audit Lifecycle

**Checkout**:
A recorded session representing a Maintainer taking physical custody of a Toolbox. A Toolbox can only have one active Checkout at a time.
_Avoid_: Lease, reservation, check out, custody session

**Audit**:
A formal inventory verification of all tools in a Toolbox, composed of individual drawer checks. It can be triggered by checkout (`checkout`), schedule (`periodic`), or an at-will action (`at-will`).
_Avoid_: Inspection, check, count, scan

**Grace Period**:
The 1-hour time window following an audit's issuance within which a Maintainer must complete it.
_Avoid_: Response window, completion limit

**Overdue**:
The state of a Checkout where an issued Audit was not completed within the 1-hour Grace Period. It changes the Checkout's visual status to warn the Maintainer and Admins.
_Avoid_: Late, missed, expired

**Checkpoint Restart**:
The rolling-schedule strategy for periodic audits where the countdown to the next scheduled audit is calculated relative to the *completion time* of the current audit rather than its *issued time*.
_Avoid_: Sliding schedule, relative scheduling, fixed-interval timer

### AI Visual Pipeline

**Audit Image**:
The physical photograph of a Drawer taken by a Maintainer in the field, representing its current state during an Audit.
_Avoid_: Photo, capture, camera roll, target image

**Detection**:
The recorded audit status of a physical Tool, containing its coordinate bounding box, its presence status (`present` | `absent`), and the AI's Confidence Level.
_Avoid_: Bounding box, tool status, prediction

**Confidence Level**:
A qualitative rating (`high` | `medium` | `low`) of the AI's certainty in a tool's detection. Low-confidence detections are flagged for extra attention.
_Avoid_: Probability, certainty score, calibration float

**Find Mode**:
An AI processing mode where the vision pipeline detects and outlines all distinct physical tools visible in an image without a reference template. Used during Template creation or audits where no template is assigned.
_Avoid_: Discovery mode, object detection, open detection

**Match Mode**:
An AI processing mode where the vision pipeline uses a Reference Template to locate and verify the presence or absence of a specific list of expected tools in an Audit Image.
_Avoid_: Comparison mode, verification mode, template matching

**User Validation**:
The mandatory manual confirmation step where a Maintainer reviews the AI-generated Detections and confirms or toggles the presence status (`present` | `absent`) of each expected tool. Maintainers are restricted from modifying bounding box coordinates during an Audit; coordinate editing is exclusive to Admins in the Template Builder.
_Avoid_: Override, manual check, supervisor signoff, confirmation

### Multi-Tenancy & Onboarding

**Invitation**:
A pending permission record created by an Admin that authorizes a specific email address to register as a Maintainer for their Organization.
_Avoid_: Invite token, registration pass, signup link

**Registration**:
The secure process through which a Maintainer creates their login credentials, maps their account to their chosen Organization, and consumes all of their active invitations.
_Avoid_: Onboarding, signup, account enrollment

**Subscription**:
A recurring billing relationship between an Organization and ToolSight (tentatively configured as a monthly fee). Subscription validity is enforced directly at the database and storage layers using Firebase Security Rules, blocking document and image reads/writes if payment lapses.
_Avoid_: Membership, payment, plan
