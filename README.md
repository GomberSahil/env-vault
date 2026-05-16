# env-vault 🔐

**Encrypted `.env` management that travels with your git branches.** One key file. Zero infrastructure.

[![npm version](https://img.shields.io/npm/v/@gombersahil/env-vault.svg?style=flat-square)](https://www.npmjs.com/package/@gombersahil/env-vault)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## The Problem

Your `.env` file contains database passwords, API keys, and signing secrets. It lives on your machine, gets shared over Slack, goes stale the moment someone rotates a key, and gets accidentally committed to git at least once per team per year. 

There is no good story for how a new developer gets the right secrets for the right branch.

## The Solution

`env-vault` fixes this by encrypting your secrets and committing them alongside your code. 
- **Checkout a branch** — get that branch's secrets. 
- **Merge to main** — get main's secrets. 
- **Rotate a key** — commit the encrypted vault, and everyone else gets it on their next `git pull`.

The environment is always aligned with the code. One key (file or passphrase) is all you manage.

---

## How it works

`env-vault` creates a deterministic environment by separating shared secrets from local overrides:

```text
.env              ← Plaintext. Gitignored. Generated from vault + local.
.env.shared.vault ← Encrypted. Committed to Git. Safe to share.
.env.local        ← Machine-specific config (e.g. PORT=4000). Gitignored.
.env.key          ← 32-byte master key (Optional. can also be passphrase to derive key). Gitignored. Shared once out-of-band.
.vault-config.json ← Project metadata and salt. Committed to Git.
```

---

## Installation

```bash
npm install -g @gombersahil/env-vault
# or use it via npx
npx @gombersahil/env-vault <command>
```

---

## Quick Start

### 1. Initialize
Run this in your project root. It will generate a master key and a config file.

```bash
vault init
```

By default, this creates a `.env.key` file. You can also use `passphrase` mode:
```bash
vault init --key-mode passphrase
```

### 2. Add Secrets
Put your secrets in a `.env` file (if you don't have one, `vault init` creates an example).

```bash
# .env
DATABASE_URL=postgres://user:pass@localhost:5432/db
STRIPE_API_KEY=sk_test_...
```

### 3. Encrypt
Encrypt the `.env` file into the vault.

```bash
vault encrypt
```
This creates `.env.shared.vault`. This file is safe to commit to Git.

### 4. Share with Team
Commit the vault and the config:
```bash
git add .env.shared.vault .vault-config.json .env.example
git commit -m "chore: setup env-vault"
```
**Important:** Securely share the `.env.key` file with your teammates (or the passphrase if using that mode) via a secure channel (e.g., 1Password, Slack Huddle, etc.).

---

## Commands

| Command | Description |
| :--- | :--- |
| `vault init` | Initialize env-vault in the current directory. |
| `vault encrypt` | Encrypts `.env` into `.env.shared.vault`. |
| `vault decrypt` | Decrypts `.env.shared.vault` and merges with `.env.local` to create `.env`. |

### Options for `init`
- `-k, --key-mode <mode>`: Choose between `file` (default) or `passphrase`.

---

## Features

- **AES-256-GCM Encryption**: Industry-standard authenticated encryption.
- **Argon2id Key Derivation**: Robust protection for passphrase-based vaults.
- **Local Overrides**: Use `.env.local` for settings that should only exist on your machine.
- **Branch Synchronization**: Since the vault is committed to Git, your secrets are always in sync with your current branch.
- **Zero Dependencies for Production**: Only needed during development. Your app just reads the standard `.env` file.

---

## Best Practices

### Gitignore
`vault init` automatically updates your `.gitignore` to prevent accidental leaks. It ensures the following are ignored:
```text
.env
.env.key
.env.local
```

### CI/CD
For CI/CD pipelines, you can provide the key via an environment variable or place the `.env.key` file in the project root before running `vault decrypt`.

---

## Security

`env-vault` uses:
- **Encryption**: AES-256-GCM (Authenticated Encryption).
- **Key Derivation**: Argon2id with project-specific salts.
- **Safety**: The versioned vault format ensures compatibility and integrity.

---

## License

MIT © [Sahil Arora](https://github.com/GomberSahil)
