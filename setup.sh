#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 IT Event Platform — Local Setup${NC}"
echo "========================================"

# ─── Prerequisites check ──────────────────────────────────────────────────────
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

check_cmd() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}✗ $1 not found. Please install it first.${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ $1 $(${1} --version 2>&1 | head -1)${NC}"
}

check_cmd node
check_cmd npm
check_cmd docker

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}✗ Node.js 18+ required. You have $(node -v)${NC}"
  exit 1
fi

# ─── Start infrastructure ─────────────────────────────────────────────────────
echo -e "\n${YELLOW}Starting PostgreSQL and Redis...${NC}"
docker compose -f docker-compose.infra.yml up -d

echo "Waiting for PostgreSQL to be ready..."
until docker exec event-postgres pg_isready -U postgres &>/dev/null; do
  sleep 1
done
echo -e "${GREEN}✓ PostgreSQL ready${NC}"

# ─── Install dependencies ─────────────────────────────────────────────────────
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# ─── Build shared packages first ─────────────────────────────────────────────
echo -e "\n${YELLOW}Building shared packages...${NC}"
cd packages/shared && npm run build 2>/dev/null || true && cd ../..
cd packages/database && npm run build 2>/dev/null || true && cd ../..

echo -e "\n${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo -e "  ${YELLOW}npm run dev${NC}        — Start all services"
echo -e "  ${YELLOW}npm run dev:backend${NC} — Start backend only"
echo -e "  ${YELLOW}npm run dev:frontend${NC}— Start frontend only"
echo ""
echo "URLs once running:"
echo "  Frontend:    http://localhost:3100"
echo "  API Docs:    http://localhost:3000/api/docs"
echo "  pgAdmin:     docker compose -f docker-compose.infra.yml --profile tools up -d"
