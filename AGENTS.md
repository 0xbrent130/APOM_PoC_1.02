# Operational Commands

## Install
```bash
npm install
```

## Quality Gates
```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

## Local app run
```bash
npm run dev
```

## VPS deployment (Docker Compose)
```bash
cp .env.compose.example .env.compose
./ops/deploy.sh
./ops/smoke-check.sh http://localhost
```
