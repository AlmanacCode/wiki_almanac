# wiki_almanac

Local Dockerized MediaWiki setup for spinning up a mini wiki quickly.

## What this repo does

- Runs MediaWiki locally with Docker
- Uses MediaWiki itself as the site users visit
- Gives you wiki-native features like `Main Page`, categories, talk pages, page history, and special pages out of the box
- Includes starter seed pages for a topic wiki

## Architecture

- `mediawiki` container: the actual wiki application
- `database` container: MariaDB backing store for MediaWiki
- `seed-pages/`: starter `.wiki` files you can import into the local wiki
- `scripts/setup_mediawiki.sh`: starts Docker and installs MediaWiki
- `scripts/import_seed_pages.sh`: imports starter pages into the wiki

## Quick start

1. Start Docker Desktop.

2. Install and start MediaWiki locally:

```bash
./scripts/setup_mediawiki.sh
```

3. If you want starter content, import it:

```bash
./scripts/import_seed_pages.sh
```

4. Open the wiki:

- Local wiki: [http://127.0.0.1:8080](http://127.0.0.1:8080)

## If a previous install failed

Reset the local Docker state and reinstall:

```bash
docker-compose down -v
./scripts/setup_mediawiki.sh
```

## Default local credentials

- Username: `admin`
- Password: `WikiAlmanacRender!2026`

Override them inline if you want different values:

```bash
MEDIAWIKI_ADMIN_USER=myadmin MEDIAWIKI_ADMIN_PASSWORD='A-strong-password-123!' ./scripts/setup_mediawiki.sh
```

## What “out of the box” means here

MediaWiki does not write your content for you, but it already knows how wiki behavior should work. Once pages exist, MediaWiki automatically provides:

- linked article pages
- category pages from `[[Category:...]]`
- talk pages via `Talk:Page Name`
- special pages like `Special:AllPages` and `Special:RecentChanges`
- edit history and revision tracking

## URL note

This local setup serves the wiki from the site root on port `8080`, so the intended base URL is:

- [http://127.0.0.1:8080](http://127.0.0.1:8080)

## Starter pages

The repo includes starter topic pages in [`seed-pages/`](/Users/kushagrachitkara/Downloads/reverie/wiki_almanac/seed-pages), including:

- `Main Page`
- `Lord of the Rings`
- `Gandalf`
- `Frodo Baggins`
- category pages for characters, places, artifacts, and works
