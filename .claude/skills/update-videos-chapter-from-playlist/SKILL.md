---
name: update-videos-chapter-from-playlist
description: Récupère les vidéos d'une playlist YouTube de la chaîne Académie WS et met à jour la base (chapter.url_video) du cours correspondant. À utiliser dès que l'utilisateur donne une playlist (ou un lien de vidéo) YouTube et demande de mettre à jour / rattacher / migrer les vidéos d'un cours (« mets à jour le cours X avec cette playlist », « j'ai ajouté des vidéos, relis la playlist », « gère cette playlist »).
---

# Mettre à jour les vidéos des chapitres depuis une playlist YouTube

Rattache chaque vidéo d'une playlist au bon chapitre d'un cours de la base Académie WS (Postgres via Prisma), en écrivant l'URL `https://www.youtube.com/watch?v=<id>` dans `chapter.url_video`.

Les scripts sont dans `.claude/skills/update-videos-chapter-from-playlist/scripts/` et se lancent **depuis la racine du projet** (ils lisent `DATABASE_URL` dans `.env`). Aucune clé API YouTube n'est nécessaire.

## Procédure

1. **Identifier la playlist.** Prends l'id après `list=` (les ids de l'utilisateur sont parfois coupés mais fonctionnent tels quels).
   - Si le lien est celui d'**une seule vidéo** (`watch?v=…` sans `list=`), ne rattache rien : liste les playlists de la chaîne avec
     `node .claude/skills/update-videos-chapter-from-playlist/scripts/fetch-playlist.mjs --channel`
     et choisis la playlist du cours (vérifie qu'elle contient bien la vidéo donnée), puis dis à l'utilisateur laquelle tu as retenue.
2. **Récupérer les vidéos :**
   `node …/scripts/fetch-playlist.mjs <playlistId> /tmp/playlist.json`
   - Si la sortie signale « YouTube a MASQUÉ N vidéos » : elles sont privées / en traitement. **Stop** : demande à l'utilisateur de les passer en « Non répertoriée » ou « Publique », puis relance. Ne devine rien.
   - Si le compteur n'a pas bougé alors que l'utilisateur dit avoir ajouté des vidéos, relance une fois (cache YouTube de quelques minutes) puis dis-lui clairement que rien de nouveau n'est visible (privées, hors playlist, délai).
3. **Identifier le cours** (id, slug ou titre : `3`, `css`, `"Google Tag Manager"`). En cas de doute, `SELECT id, title, slug FROM course` via Prisma ; ne devine pas entre deux cours proches (PHP / PHPOO / PHP MVC, JAVA SE / JAVA POO…).
4. **Aperçu (sans écrire) :**
   `node …/scripts/apply-to-course.mjs <cours> /tmp/playlist.json`
   Lis toute la sortie : chapitres appariés, `⚠` douteux, chapitres sans vidéo, vidéos non utilisées.
5. **Appliquer** si l'aperçu est cohérent : même commande + `--apply` (sauvegarde automatique dans `.backups/`, ignoré par git).
   - `⚠` = numéro identique mais titre très différent : vérifie à l'œil ; s'il est correct, ajoute `--accept-weak`.
   - Cas particulier forcé : `--map <chapitreId>=<videoId>` (répétable).
6. **Résumer en français** à l'utilisateur : nombre de chapitres mis à jour, chapitres restés sans vidéo (ils affichent « Vidéo non disponible »), vidéos non utilisées (doublons, vidéo d'un autre cours, quiz…), emplacement de la sauvegarde.

## Règles de rapprochement (scripts)

- Par **numéro** (`07 - …`, `1.2`, `16.2`) puis titre : le numéro seul ne suffit pas, le titre doit rester proche, sinon `⚠`.
- Chapitre **sans numéro** (ex. « Les pilliers… », « TP - … ») : seulement si le titre est quasi identique.
- **Doublons** dans la playlist (même numéro, titre identique ou suffixé « copie », « 2 »…) : un seul est utilisé (le 1er de la playlist ou le plus proche), l'autre est listé en « non utilisées » → signale-le à l'utilisateur pour qu'il le supprime de sa chaîne.
- Les accents, majuscules et ponctuation sont ignorés ; les noms de chapitres en base ne sont **pas** modifiés.
- Seul `url_video` change. Durées, titres, ordre, disponibilité du cours ne sont pas touchés.

## Cas hors périmètre des scripts

- **Plusieurs vidéos par chapitre** (ex. plan « partie 01 : vidéos 01 à 08 ») : le site n'a qu'une vidéo par chapitre. Crée un chapitre par vidéo et utilise `chapter_part` pour regrouper en parties (voir le cours Python POO, id 12 : titres `NN - …`, `chapterPart` en majuscules, `numOrder` 1..N, `free=true`, `available=true`, `type='cours'`, durées lues sur YouTube ; sauvegarde puis `deleteMany` + `createMany` dans une transaction ; puis `course.chapterCount`). Demande confirmation avant de remplacer des chapitres existants.
- **Chapitre manquant en base** pour une vidéo (ex. « 23 QUIZ ») : ne l'invente pas, propose de le créer dans le back-office (`/admin/chapters/new`).

## À savoir

- Les pages publiques sont en cache ISR **1 h** : une modification directe en base peut mettre jusqu'à une heure à apparaître sur academiews.com (un enregistrement depuis le back-office rafraîchit tout de suite). Prévenir l'utilisateur ; ne pas conclure à un bug.
- La base distante est parfois lente ou injoignable : les scripts réessaient seuls (6 tentatives).
- Les chapitres restés en Vimeo (`<iframe …vimeo…>`) affichent « Vidéo non disponible » : c'est voulu tant qu'aucune URL YouTube n'est fournie. Le back-office → Chapitres → filtre « Vimeo (à migrer) » les liste.
- Ne jamais afficher les secrets (`.env`, `DATABASE_URL`) dans la conversation.
