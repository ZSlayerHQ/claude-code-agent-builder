#!/usr/bin/env bash
# Project setup — runs before first Claude Code session.
# Customise per stack. The point is that the AI can run this script
# to recover from "fresh checkout" rather than re-discovering setup
# from scratch.
#
# Per Anthropic's project-setup guidance:
# "Have Claude create init.sh scripts for servers, test suites, and
# linters to avoid repeated setup work."

set -euo pipefail

cd "$(dirname "$0")"

echo "Setting up <project-name>..."

# 1. Dependencies — uncomment + customise per stack
# pnpm install
# uv sync
# cargo build
# bundle install

# 2. Environment — copy .env.example if .env missing
# if [ ! -f .env ]; then
#   cp .env.example .env
#   echo "WARN: .env created from .env.example — fill in real secrets before running."
# fi

# 3. Database — uncomment if applicable
# docker compose up -d postgres redis
# pnpm prisma migrate dev
# pnpm db:seed

# 4. Codegen — uncomment if applicable
# pnpm lexicon:generate
# pnpm prisma generate

# 5. Verify — quick smoke tests
# pnpm tsc --noEmit
# pnpm lint --quiet

echo "Setup complete. Run start.bat (Windows) or 'claude --dangerously-skip-permissions -n \"<project-name>\"' to launch Claude Code."
