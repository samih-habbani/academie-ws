---
name: translate-site-content
description: Traduit en anglais (ou une autre langue) le contenu de la base Académie WS — cours, chapitres, catégories, thématiques — et le stocke dans la table `translation`, sans API de traduction : c'est Claude qui traduit, dans la session. À utiliser quand l'utilisateur ajoute ou modifie des cours/chapitres et demande de « traduire les nouveautés », de « mettre à jour les traductions », ou d'ajouter une nouvelle langue au site.
---

# Traduire le contenu du site (sans API)

Le français est la **seule source** en base. Les traductions vivent dans la table `translation` (une ligne par entité/champ/langue, avec l'empreinte du texte français traduit). Le site affiche la traduction si elle existe, sinon le français. Les textes de l'interface (menus, boutons…) ne sont **pas** dans cette table : ils sont dans `lib/i18n/fr.ts` et `lib/i18n/en.ts`.

Scripts dans `.claude/skills/translate-site-content/scripts/`, à lancer **depuis la racine du projet** (ils lisent `DATABASE_URL`).

## Procédure

1. **Lister ce qui manque ou a changé** (la langue est `en` par défaut) :
   `node .claude/skills/translate-site-content/scripts/export-missing.mjs en /tmp/tr-en.json`
   Le résumé indique le nombre de champs, dont « modifiés depuis » (français changé après la traduction) et le nombre de textes **uniques** (« 00 - Présentation » n'est à traduire qu'une fois). Si 0 : il n'y a rien à faire, le dire à l'utilisateur.
2. **Lire les textes** par lots d'environ 300–400 :
   `node -e "const d=require('/tmp/tr-en.json'); console.log(d.texts.slice(0,300).map(t=>t.id+'|'+t.fr.replace(/\n/g,' ⏎ ')).join('\n'))"`
3. **Traduire** chaque texte et l'écrire dans un fichier `/tmp/tr/b1.txt`, `b2.txt`… au format `id|traduction`, une ligne par texte (heredoc `<<'EOF'` pour éviter les soucis de guillemets). Les sauts de ligne restent écrits « ⏎ ».
4. **Vérifier puis importer** :
   `node …/import-translations.mjs /tmp/tr-en.json /tmp/tr/b1.txt /tmp/tr/b2.txt …` (aperçu : couverture, textes manquants, traductions identiques au français)
   puis la même commande avec `--apply`. Relancer `export-missing.mjs` : il doit afficher 0 champ.
5. **Prévenir l'utilisateur** : combien de champs traduits, et que les pages publiques sont en cache ISR (jusqu'à 1 h) avant d'afficher la traduction.

## Règles de traduction

- Garder le préfixe numérique des chapitres : « 05 - Les variables » → « 05 - Variables ». Ne pas renuméroter.
- **Ne pas traduire** : noms de technologies, de produits, de fonctions, de commandes et de code (Python, Symfony, jQuery, `exec()`, `$_POST`, Tomcat, Make.com, Google Tag Manager…).
- Titres de cours en MAJUSCULES restent en majuscules. « TP » → « Lab » ; « Exercice » → « Exercise » ; « Formation » → « course » ; « Cours » (titre de leçon) → « Lesson » si c'est un type, « course » sinon.
- Garder le ton : descriptions de cours engageantes, titres de chapitres courts et factuels.
- Corriger sans bruit les fautes évidentes du français source (« Dévellopez », « mutliples ») dans la traduction ; ne pas modifier le français.
- Un texte déjà en anglais est recopié tel quel.

## Nouvelle langue (ex. `es`)

1. Ajouter la langue dans `lib/i18n/config.ts` (`LANGS`, `INTL_LOCALE`), créer `lib/i18n/es.ts` (même forme que `en.ts`, typé `Dict`) et l'enregistrer dans `lib/i18n/dictionaries.ts`.
2. Lancer cette procédure avec `es` à la place de `en`.
3. Le sélecteur de langue de la barre de navigation et le routage `/es/…` suivent automatiquement `LANGS`.

## À savoir

- Modifier un texte français dans le back-office ne supprime pas sa traduction : l'ancienne traduction reste affichée jusqu'à la prochaine exécution de cette skill (qui la détecte comme « modifiée depuis »).
- Une traduction peut être corrigée à la main : la modifier directement dans la table `translation` ; elle est écrasée seulement si le français change ensuite.
- Ne jamais afficher les secrets (`.env`, `DATABASE_URL`).
