# Page Flood

A userscript that helps you batch open links from the main list on any webpage. Perfect for quickly exploring Google search results or visiting all detail pages in a list.

## Features

- **Smart Link Detection**: Automatically identifies the main list of links on a page using a Bag-of-Words model
- **Batch Opening**: Open multiple links at once with a single keyboard shortcut
- **Rate Limiting**: Opens links in batches of 8 with confirmation dialogs
- **Deduplication**: Prevents opening the same URL multiple times
- **Universal**: Works on any HTTP/HTTPS website

## Installation

1. Install a userscript manager (e.g., [Tampermonkey](https://www.tampermonkey.net/), [Violentmonkey](https://violentmonkey.github.io/))
2. Install the script from [Greasy Fork](https://greasyfork.org/scripts/528027)
3. The script will automatically run on all websites

## Usage

Press **Shift + Alt + Q** on any webpage to:
1. Automatically detect the main list of links
2. See a confirmation dialog with the URLs to be opened
3. Open the links in new tabs (in batches of 8)

## How It Works

The script uses a Bag-of-Words model to analyze link features including:
- CSS class names
- HTML attributes
- Link structure and similarity

It then groups similar links, scores the groups, and identifies the most relevant list of links on the page.

## Version

Current version: 2.1.2

## Author

snomiao@gmail.com

