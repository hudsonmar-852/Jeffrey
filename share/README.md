# Share Mobile Guidebook Publishing System

Purpose: turn any supplied content into a mobile-first, easy-to-read HTML guidebook that can be published under `/share/` in this GitHub Pages repo.

Default output URL pattern:

```text
https://hudsonmar-852.github.io/Jeffrey/share/[topic-slug].html
```

## Standard Workflow

1. Read the user's raw content.
2. Identify the real objective, audience, and reading context.
3. Improve structure and wording for clarity.
4. Split content into mobile pages.
5. Create a content page as Page 1.
6. Add one focused idea per page.
7. Add quote boxes or action boxes where useful.
8. Add bottom-right navigation on every page:
   - ⌂ back to content page
   - ‹ previous page
   - › next page
9. Use a clean high-contrast mobile-first HTML/CSS layout.
10. Save the file under `/share/[topic-slug].html`.
11. Return the public GitHub Pages URL.

## File Naming Rule

Automatically create a simple lowercase English slug from the topic.

Examples:

| Topic | File |
|---|---|
| Jeffrey 高端女客對話手冊 | `jeffrey-premium-clients.html` |
| AI Daily Report SOP | `ai-daily-report-sop.html` |
| Sales Message Guide | `sales-message-guide.html` |

## Page Structure Rule

Page 1 must be the content page and include:

- Objective
- Best use case
- Content structure / sections
- Reading instructions

Each following page should include:

- Page number
- Short category label
- Clear title
- 3-5 short points maximum
- Quote / action box if useful
- Bottom-right navigation

## Design Rule

Mobile-first only:

- Max width: 430px
- Full screen page sections
- High contrast colours
- Large Traditional Chinese readable fonts
- No tiny text
- No crowded paragraphs
- One idea per page

Suggested palette:

- Dark: navy / charcoal background, warm cream text, gold / teal accents
- Light: cream background, charcoal text, emerald / gold accents

## GitHub Rule

Repository:

```text
hudsonmar-852/Jeffrey
```

Folder:

```text
/share/
```

If file exists, fetch SHA first and update. If file does not exist, create it.

## User Command Example

```text
Use the share mobile guidebook method. Topic: [topic]. Content: [paste content]. Create the GitHub page under /share.
```
