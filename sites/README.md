    1→# Sites
    2→
    3→This folder contains all site-specific content for the multi-site architecture.
    4→
    5→## Structure
    6→
    7→Each site has its own folder with the following structure:
    8→
    9→```
   10→sites/{site-id}/
   11→  config.json       - Site configuration
   12→  templates/        - HTML templates
   13→  media/
   14→    images/         - Gallery images
   15→    videos/         - Video content (usually symlinked)
   16→    saved_images/   - Additional images (usually symlinked)
   17→    static/         - Static assets (logos, icons, etc.)
   18→  styles/           - CSS files
   19→  schedule.json     - TV broadcast schedule
   20→```
   21→
   22→## config.json
   23→
   24→Each site requires a `config.json` file with:
   25→
   26→```json
   27→{
   28→  "id": "site-id",
   29→  "domain": "example.com",
   30→  "name": "Site Name",
   31→  "meta": {
   32→    "title": "Page Title",
   33→    "description": "Site description",
   34→    "keywords": "comma, separated, keywords",
   35→    "author": "Author Name",
   36→    "themeColor": "#hexcolor",
   37→    "ogImage": "/path/to/image",
   38→    "twitter": "@handle"
   39→  },
   40→  "templates": {
   41→    "index": "index.html",
   42→    "gallery": "gallery.html"
   43→  },
   44→  "schedule": {
   45→    "file": "schedule.json",
   46→    "epochStart": 1735689600000,
   47→    "programSeed": 247420
   48→  }
   49→}
   50→```
   51→
   52→## Templates
   53→
   54→Templates use a simple variable substitution syntax:
   55→
   56→- `{{ variable }}` - Insert variable value
   57→- `{{ meta.title }}` - Access nested properties
   58→- `{% if condition %}...{% endif %}` - Conditional rendering
   59→- `{% for item in array %}...{% endfor %}` - Loop over arrays
   60→
   61→Variables come from config.json and any additional data passed during rendering.
   62→
   63→## Adding a New Site
   64→
   65→1. Create folder: `mkdir -p sites/newsite/{templates,media,styles}`
   66→2. Copy config.json from existing site and modify
   67→3. Copy templates or create new ones
   68→4. Add media content to appropriate folders
   69→5. Create schedule.json with TV programming
   70→6. Restart server to load the new domain mapping
   71→
   72→## Asset Paths
   73→
   74→In templates, use:
   75→- `/site-assets/media/...` for media files
   76→- `/site-assets/styles/...` for CSS files
   77→- `/api/{site-id}/schedule` for schedule data
   78→- `/api/{site-id}/media/{type}` for media listings
   79→
   80→## Existing Sites
   81→
   82→- **schwepe**: Main site at schwepe.247420.xyz
   83→- **
   84→