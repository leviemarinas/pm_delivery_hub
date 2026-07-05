# Atlas Delivery Hub

A reusable, Azure DevOps-inspired project delivery system seeded from the Atlas Payroll requirements document.

## Included

- Shared-credential login
- Persistent multi-user server state
- Reusable project workspaces
- Epic, Feature, User Story, Task, and Bug CRUD
- Phase 1/2/3 backlog with MoSCoW prioritization on every Feature and User Story
- Expandable backlog hierarchy plus sprint, phase, and dependency filtering
- Sprint-filtered Kanban board with a dedicated unplanned-work lane and unplanned Epic/Feature
- Editable acceptance criteria, QA focus, dependencies, source trace, child tasks, linked QA cases, and audit activity
- Client Overview, live project status, risks, targets, and QA readiness
- Editable 10-slide Sprint Presentation with live ADO-style metrics, presenter mode, keyboard navigation, and print/PDF output
- Excel test-case template, previewed import to User Stories, update/create behavior, and Excel export
- CSV work-item export with phase, MoSCoW, and dependency fields
- Responsive desktop and mobile interfaces

## Atlas delivery coverage

- 5 planned features plus an unplanned-work container
- 24 user stories
- 155 Dev/QA tasks
- 129 acceptance criteria
- 92 linked QA scenarios
- 478 retained source-document blocks

## Run

```powershell
pnpm install
pnpm build
pnpm start
```

Open `http://127.0.0.1:4173`.

Default local credential:

- Username: `atlas`
- Password: `atlas2026`

Override both values before network use:

```powershell
$env:ATLAS_USERNAME='your-user'
$env:ATLAS_PASSWORD='your-strong-password'
pnpm start
```

Application data persists in `data/atlas-hub.json`. The server binds to `0.0.0.0` by default so trusted-network users can connect; set `HOST=127.0.0.1` to restrict access to the local machine.

## Sprint Presentation workflow

Open **Sprint Presentation** from the sidebar. Use **Edit update** to maintain the client narrative, decisions, next-sprint goals, and client asks. Delivery, progress, QA, risk, and work-item slides calculate directly from the project state. Use **Present** for a distraction-free client review or **Print / PDF** to create a portable deck copy.

## Test-case Excel workflow

Open **QA & Tests** and download the Excel template. The import reads the first worksheet and requires `User Story ID` and `Test Case Title`. An existing `Test Case ID` updates that test; a blank or new ID creates one. The importer validates User Story references and shows a preview before saving. Use **Export Excel** to download the current QA pack.

Template: `public/templates/Atlas_Test_Case_Import_Template.xlsx`
