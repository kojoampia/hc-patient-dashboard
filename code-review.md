# Code Review: Health Connect Patient Dashboard

**Scope:** Recently modified files against current `HEAD`

## Actionable tasks

### 1. Align registry configuration across deploy and runtime files

- **Files:** `build-deploy.sh`, `docker-compose-prod.yml`
- **Context:** The deploy script now pushes to `docker.jojoaddison.net`, while the production compose file still references `docker-registry.jojoaddison.net`.
- **Risk:** Images pushed by the script will not match the registry that production tries to pull from.
- **Action:** Standardize both files on the same registry hostname after confirming the intended production registry.

### 2. Fix the project/image naming mismatch in `build-deploy.sh`

- **File:** `build-deploy.sh`
- **Context:** The script builds/tag/push logic now uses `hc-patient-dashboard`, but the `name` variable and folder detection logic still use `patientdashboard`.
- **Risk:** When the script is run outside the expected directory, it may derive the wrong path and fail before building.
- **Action:** Update the `name` variable and any related path assumptions so directory detection matches the actual image/project name used later in the script.

### 3. Add explicit version handling in `build-deploy.sh`

- **File:** `build-deploy.sh`
- **Context:** The script prints that a random version will be used when no argument is passed, but no fallback version is actually generated before tag/push commands use `$version`.
- **Risk:** Docker commands can receive an empty tag and fail with invalid tag format errors.
- **Action:** Either require a version argument and exit with usage guidance, or generate a concrete fallback version before any Docker tag/push step.

### 4. Update misleading branch/remote messaging in `build-deploy.sh`

- **File:** `build-deploy.sh`
- **Context:** The script prints that it is synchronizing with `master` on Bitbucket, but the actual command is just `git pull -r` on the current branch.
- **Risk:** The message is misleading during maintenance and can cause confusion if the default branch is `main` or if the remote is no longer Bitbucket.
- **Action:** Change the message to reflect actual behavior, or make the git command explicit if the script truly depends on a specific branch.

## Files reviewed with no meaningful issues found

### `AGENT.md`

- Documentation-only addition.
- The content is coherent, repo-specific, and does not introduce correctness or maintainability concerns.

### `.github/copilot-instructions.md`

- Documentation-only addition.
- No actionable code-quality or correctness issues found.

### Other `.github` markdown additions

- Documentation/planning only.
- No executable impact found in the reviewed changes.
