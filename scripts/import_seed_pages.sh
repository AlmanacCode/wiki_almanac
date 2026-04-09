#!/usr/bin/env bash
set -euo pipefail

SEED_DIR=${1:-seed-pages}
IMPORT_USER=${MEDIAWIKI_IMPORT_USER:-"SeedImporter"}
IMPORT_SUMMARY=${MEDIAWIKI_IMPORT_SUMMARY:-"Import starter wiki pages"}
CONTAINER_SEED_DIR=/tmp/wiki-seed-pages

if [[ ! -d "$SEED_DIR" ]]; then
  echo "Seed directory '$SEED_DIR' does not exist."
  exit 1
fi

echo "Importing starter pages from ${SEED_DIR}..."
docker-compose exec -T mediawiki rm -rf "${CONTAINER_SEED_DIR}"
docker-compose exec -T mediawiki mkdir -p "${CONTAINER_SEED_DIR}"
docker cp "${SEED_DIR}/." wiki-almanac-mediawiki:"${CONTAINER_SEED_DIR}"
docker-compose exec -T mediawiki php maintenance/run.php importTextFiles.php \
  --overwrite \
  -u "${IMPORT_USER}" \
  -s "${IMPORT_SUMMARY}" \
  "${CONTAINER_SEED_DIR}"/*.wiki

echo "Starter pages imported."
