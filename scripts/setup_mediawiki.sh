#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME=${MEDIAWIKI_PROJECT_NAME:-"Wiki Almanac"}
ADMIN_USER=${MEDIAWIKI_ADMIN_USER:-admin}
ADMIN_PASSWORD=${MEDIAWIKI_ADMIN_PASSWORD:-WikiAlmanacRender!2026}
DB_NAME=${MEDIAWIKI_DB_NAME:-wiki_almanac}
DB_USER=${MEDIAWIKI_DB_USER:-root}
DB_PASSWORD=${MEDIAWIKI_DB_PASSWORD:-rootpass}
DB_ROOT_PASSWORD=${MEDIAWIKI_DB_ROOT_PASSWORD:-rootpass}
SERVER_URL=${MEDIAWIKI_SERVER_URL:-http://127.0.0.1:8080}
SCRIPT_PATH=${MEDIAWIKI_SCRIPT_PATH:-}
LANGUAGE=${MEDIAWIKI_LANGUAGE:-en}

echo "Starting local MediaWiki services..."
docker-compose up -d database mediawiki

echo "Waiting for MediaWiki container to become available..."
until docker-compose exec -T mediawiki php -v >/dev/null 2>&1; do
  sleep 2
done

if docker-compose exec -T mediawiki test -f /var/www/html/LocalSettings.php; then
  echo "MediaWiki is already installed."
  exit 0
fi

echo "Installing MediaWiki with a local admin user..."
docker-compose exec -T mediawiki php maintenance/run.php install \
  --dbtype=mysql \
  --dbserver=database \
  --dbname="${DB_NAME}" \
  --dbuser="${DB_USER}" \
  --dbpass="${DB_PASSWORD}" \
  --installdbuser="${DB_ROOT_PASSWORD:+root}" \
  --installdbpass="${DB_ROOT_PASSWORD}" \
  --server="${SERVER_URL}" \
  --scriptpath="${SCRIPT_PATH}" \
  --lang="${LANGUAGE}" \
  --pass="${ADMIN_PASSWORD}" \
  "${PROJECT_NAME}" \
  "${ADMIN_USER}"

docker-compose exec -T mediawiki php -r '
$settings = "/var/www/html/LocalSettings.php";
$contents = file_get_contents($settings);
$contents = str_replace("\$wgScriptPath = \"/\";", "\$wgScriptPath = \"\";", $contents);
file_put_contents($settings, $contents);
'

echo "MediaWiki is ready at ${SERVER_URL}"
echo "Log in with ${ADMIN_USER} and the configured admin password."
