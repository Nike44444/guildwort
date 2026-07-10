# GuildWort

A static Wordle tournament app. Custom games can be shared with an invite URL; the URL encodes the title and five-letter word, so no backend is required for individual puzzle sharing.

## Publish it publicly with Vercel

1. Create a GitHub repository and upload this folder.
2. Go to [vercel.com/new](https://vercel.com/new) and import that repository.
3. Keep the default settings—this is a static site with no build command.
4. Click **Deploy**.
5. Open the resulting `https://…vercel.app` site, create a game, and use **Copy invite link**.

Anyone opening that link can play the word you created from their own device.

> The secret word is encoded in the link for this prototype. Add a backend before using it for competitive games where the answer must be hidden.
