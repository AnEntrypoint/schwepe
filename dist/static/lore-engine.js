class LoreEngine {
  constructor() {
    this.loreData = null;
    this.currentTheme = 'cyberpunk';
    this.themes = {
      'cyberpunk': {
        colors: ['#f093fb', '#f5576c', '#4a90e2'],
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        fonts: ['Fredoka']
      },
      'neon-noir': {
        colors: ['#ff006e', '#8338ec', '#3a86ff'],
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        fonts: ['Fredoka']
      },
      'cosmic-horror': {
        colors: ['#7209b7', '#560bad', '#480ca8'],
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0033 100%)',
        fonts: ['Fredoka']
      },
      'occult-cyber': {
        colors: ['#c77dff', '#e0aaff', '#10002b'],
        background: 'linear-gradient(135deg, #240046 0%, #3c096c 100%)',
        fonts: ['Fredoka']
      },
      'cyberpunk-finance': {
        colors: ['#00f5ff', '#ff006e', '#ffbe0b'],
        background: 'linear-gradient(135deg, #001d3d 0%, #003566 100%)',
        fonts: ['Fredoka']
      }
    };
  }

  async init() {
    try {
      const response = await fetch('/lore-data.json');
      this.loreData = await response.json();
      console.log('🚀 Lore engine initialized with', this.loreData.length, 'chapters');
    } catch (error) {
      console.error('❌ Failed to load lore data:', error);
    }
  }

  getChapter(id) {
    return this.loreData?.find(chapter => chapter.id === id);
  }

  getAllChapters() {
    return this.loreData || [];
  }

  getThemeConfig(theme) {
    return this.themes[theme] || this.themes['cyberpunk'];
  }

  generateLoreHTML(chapterId, isInline = false) {
    const chapter = this.getChapter(chapterId);
    if (!chapter) return '<div>Chapter not found</div>';

    const theme = this.getThemeConfig(chapter.theme);

    let html = `
      <div class="lore-chapter ${isInline ? 'chapter-inline' : ''}" data-theme="${chapter.theme}">
        <div class="chapter-header">
          <div class="chapter-icon">${chapter.icon}</div>
          <h1 class="chapter-title">${chapter.title}</h1>
          <p class="chapter-subtitle">${chapter.subtitle}</p>
        </div>

        <div class="chapter-content">
    `;

    chapter.sections.forEach(section => {
      html += this.generateSectionHTML(section);
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  generateSectionHTML(section) {
    let html = `
      <div class="lore-section section-${section.type}">
        <h2 class="section-title">${section.title}</h2>
        <div class="section-content">
    `;

    if (section.type === 'rules' || section.type === 'archetypes' || section.type === 'hierarchy') {
      html += '<ul class="lore-list">';
      section.content.forEach(item => {
        html += `<li class="lore-item">${item}</li>`;
      });
      html += '</ul>';
    } else {
      section.content.forEach(item => {
        if (item.headline && item.copy) {
          html += `
            <div class="content-block">
              <h3 class="content-headline">${item.headline}</h3>
              <p class="content-copy">${item.copy}</p>
            </div>
          `;
        }
      });
    }

    html += `
        </div>
      </div>
    `;

    return html;
  }

  generateNavigationHTML() {
    const chapters = this.getAllChapters();
    let html = '<div class="lore-nav">';

    chapters.forEach((chapter, index) => {
      html += `
        <a href="#${chapter.id}" class="nav-item" data-chapter="${chapter.id}">
          <span class="nav-icon">${chapter.icon}</span>
          <div class="nav-text">
            <div class="nav-title">${chapter.title}</div>
            <div class="nav-subtitle">${chapter.subtitle}</div>
          </div>
        </a>
      `;
    });

    html += '</div>';
    return html;
  }

  injectThemeStyles(theme) {
    const config = this.getThemeConfig(theme);
    const styleId = 'dynamic-lore-styles';

    let styles = document.getElementById(styleId);
    if (!styles) {
      styles = document.createElement('style');
      styles.id = styleId;
      document.head.appendChild(styles);
    }

    styles.textContent = `
      .theme-${theme} {
        --primary-color: ${config.colors[0]};
        --secondary-color: ${config.colors[1]};
        --accent-color: ${config.colors[2]};
        --theme-background: ${config.background};
      }

      .lore-chapter[data-theme="${theme}"] {
        background: ${config.background};
      }

      .lore-chapter[data-theme="${theme}"] .chapter-title {
        color: ${config.colors[0]};
        text-shadow: 0 0 20px ${config.colors[0]}40;
      }

      .lore-chapter[data-theme="${theme}"] .section-title {
        color: ${config.colors[1]};
      }

      .lore-chapter[data-theme="${theme}"] .content-headline {
        color: ${config.colors[2]};
      }
    `;
  }

  // Utility methods for dynamic content management
  addChapter(chapterData) {
    if (!this.loreData) return;
    this.loreData.push(chapterData);
    this.saveLoreData();
  }

  updateChapter(chapterId, updatedData) {
    if (!this.loreData) return;
    const index = this.loreData.findIndex(ch => ch.id === chapterId);
    if (index !== -1) {
      this.loreData[index] = { ...this.loreData[index], ...updatedData };
      this.saveLoreData();
    }
  }

  removeChapter(chapterId) {
    if (!this.loreData) return;
    this.loreData = this.loreData.filter(ch => ch.id !== chapterId);
    this.saveLoreData();
  }

  saveLoreData() {
    // This would typically save to a CMS or backend
    console.log('📝 Lore data updated:', this.loreData);
  }

  // Search functionality
  searchLore(query) {
    if (!this.loreData) return [];

    const results = [];
    const lowercaseQuery = query.toLowerCase();

    this.loreData.forEach(chapter => {
      const chapterMatches = chapter.title.toLowerCase().includes(lowercaseQuery) ||
                            chapter.subtitle.toLowerCase().includes(lowercaseQuery);

      const sectionMatches = chapter.sections.some(section =>
        section.title.toLowerCase().includes(lowercaseQuery) ||
        (section.content && section.content.some(content =>
          (content.headline && content.headline.toLowerCase().includes(lowercaseQuery)) ||
          (content.copy && content.copy.toLowerCase().includes(lowercaseQuery)) ||
          (typeof content === 'string' && content.toLowerCase().includes(lowercaseQuery))
        ))
      );

      if (chapterMatches || sectionMatches) {
        results.push(chapter);
      }
    });

    return results;
  }

  // Get random lore snippet for dynamic content
  getRandomLoreSnippet() {
    if (!this.loreData) return null;

    const randomChapter = this.loreData[Math.floor(Math.random() * this.loreData.length)];
    const randomSection = randomChapter.sections[Math.floor(Math.random() * randomChapter.sections.length)];

    if (randomSection.type === 'rules' || randomSection.type === 'archetypes' || randomSection.type === 'hierarchy') {
      return randomSection.content[Math.floor(Math.random() * randomSection.content.length)];
    } else if (randomSection.content.length > 0) {
      const randomContent = randomSection.content[Math.floor(Math.random() * randomSection.content.length)];
      return randomContent.headline || randomContent.copy;
    }

    return null;
  }
}

// Initialize the lore engine globally
window.loreEngine = new LoreEngine();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.loreEngine.init();
});