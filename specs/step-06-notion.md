# Étape 6: Intégration Notion (Lecture page spec)

**Durée estimée** : 3-4h

## Prompt Claude Code

```
Implémente l'intégration Notion pour Drift (lecture de page spec).

CONTEXTE :
- Drift utilise une Internal Integration Notion (pas OAuth pour V1).
- L'admin copie-colle l'ID d'une page Notion par projet.
- On lit le contenu de cette page pour extraire l'intent produit.
- On ne lit qu'UNE seule page par projet, pas un arbre entier.

MODULE : apps/api/src/core/integrations/notion/
Suivre l'architecture hexagonale.

COMPOSANTS À CRÉER :

1. NotionApiGateway (port interface dans domain/gateways/)
   - Utiliser @notionhq/client ET notion-to-md
   - Token : NOTION_INTEGRATION_TOKEN (un seul token par workspace en V1, depuis .env)
   - Méthodes :
     * getPage(pageId) → { title, lastEditedTime, lastEditedBy }
     * getPageContent(pageId) → string (contenu de la page en Markdown)
       - Utiliser NotionToMarkdown de notion-to-md pour convertir les blocks
       - Instancier NotionToMarkdown avec le même Client @notionhq/client
       - Appeler n2m.pageToMarkdown(pageId) puis n2m.toMarkdownString(mdblocks)
       - Retourner le champ `parent` de toMarkdownString (le markdown complet)
       - Les types de blocks supportés (paragraph, headings, lists, code, etc.)
         sont gérés nativement par notion-to-md
     * searchPages(query) → pages[] (pour l'onboarding)
   - Fake gateway pour les tests

2. ReadNotionPageQuery (application/queries/)
   - Input : pageId
   - Retourne le contenu Markdown extrait (pour inclusion dans le prompt LLM)

3. HasNotionPageChangedQuery (application/queries/)
   - Compare le lastEditedTime de la page avec la date du dernier rapport généré
   - Retourne boolean (false = skip la re-lecture)

NOTE : Pas de cron pour Notion. On lit la page au moment de la génération du rapport.
```

## Validation

- [ ] Avec un token Notion d'une Integration de test, getPage retourne la metadata
- [ ] getPageContent retourne le contenu en Markdown (headings, listes, code, etc.)
- [ ] HasNotionPageChangedQuery détecte correctement les modifications
