// Decap CMS Configuration for Phrase Management
// This config allows content editors to manage all phrases through the CMS

import { BuildTimePhraseSystem } from './static/build-time-phrases.js';
const buildTimePhrases = new BuildTimePhraseSystem();

export default {
  backend: {
    name: 'git-gateway',
    branch: 'main',
  },

  local_backend: {
    url: 'http://localhost:8080/api/v1'
  },

  locale: 'en',
  site_url: 'https://yourdomain.com',

  collections: [
    {
      name: 'settings',
      label: 'Settings',
      files: [
        {
          name: 'general',
          label: 'General Settings',
          file: 'content/settings/general.json',
          fields: [
            {
              label: 'Site Title',
              name: 'site_title',
              widget: 'select',
              options: buildTimePhrases.phraseGroups.pageTitle,
              default: buildTimePhrases.phraseGroups.pageTitle[0]
            },
            {
              label: 'Site Subtitle',
              name: 'site_subtitle',
              widget: 'select',
              options: buildTimePhrases.phraseGroups.subtitle,
              default: buildTimePhrases.phraseGroups.subtitle[0]
            }
          ]
        }
      ]
    },

    {
      name: 'phrases',
      label: 'Dynamic Phrases',
      description: 'Manage all dynamic phrases throughout the site',
      files: [
        {
          name: 'page_phrases',
          label: 'Page Phrases',
          file: 'content/phrases/page-phrases.json',
          fields: [
            {
              label: 'Page Titles',
              name: 'pageTitle',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.pageTitle
            },
            {
              label: 'Subtitles',
              name: 'subtitle',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.subtitle
            }
          ]
        },

        {
          name: 'section_phrases',
          label: 'Section Phrases',
          file: 'content/phrases/section-phrases.json',
          fields: [
            {
              label: 'Main Section Titles',
              name: 'mainSectionTitle',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.mainSectionTitle
            },
            {
              label: 'Feature Titles',
              name: 'featureTitle',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.featureTitle
            }
          ]
        },

        {
          name: 'feature_phrases',
          label: 'Feature Phrases',
          file: 'content/phrases/feature-phrases.json',
          fields: [
            {
              label: 'Age Verification Features',
              name: 'ageVerification',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.ageVerification
            },
            {
              label: 'Interactive Lore Features',
              name: 'interactiveLore',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.interactiveLore
            },
            {
              label: 'Responsive Design Features',
              name: 'responsiveDesign',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.responsiveDesign
            }
          ]
        },

        {
          name: 'meme_phrases',
          label: 'Meme Generator Phrases',
          file: 'content/phrases/meme-phrases.json',
          fields: [
            {
              label: 'Meme Generator Titles',
              name: 'memeGeneratorTitle',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.memeGeneratorTitle
            },
            {
              label: 'Meme Generator Subtitles',
              name: 'memeGeneratorSubtitle',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.memeGeneratorSubtitle
            },
            {
              label: 'Bullish Vibes',
              name: 'bullishVibes',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.bullishVibes
            },
            {
              label: 'Bearish Copium',
              name: 'bearishCopium',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.bearishCopium
            },
            {
              label: 'Gambling Addiction',
              name: 'gamblingAddiction',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.gamblingAddiction
            },
            {
              label: 'Diamond Hands',
              name: 'diamondHands',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.diamondHands
            }
          ]
        },

        {
          name: 'token_phrases',
          label: 'Token Section Phrases',
          file: 'content/phrases/token-phrases.json',
          fields: [
            {
              label: 'Token Info Titles',
              name: 'tokenInfoTitle',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.tokenInfoTitle
            },
            {
              label: 'Token Address Labels',
              name: 'tokenAddressLabel',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.tokenAddressLabel
            },
            {
              label: 'How to Buy Titles',
              name: 'howToBuyTitle',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.howToBuyTitle
            }
          ]
        },

        {
          name: 'navigation_phrases',
          label: 'Navigation Phrases',
          file: 'content/phrases/navigation-phrases.json',
          fields: [
            {
              label: 'Home Navigation',
              name: 'navHome',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.navHome
            },
            {
              label: 'Lore Navigation',
              name: 'navLore',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.navLore
            },
            {
              label: 'Stats Navigation',
              name: 'navStats',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.navStats
            }
          ]
        },

        {
          name: 'age_verification_phrases',
          label: 'Age Verification Phrases',
          file: 'content/phrases/age-verification-phrases.json',
          fields: [
            {
              label: 'Age Verification Titles',
              name: 'ageVerificationTitle',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.ageVerificationTitle
            },
            {
              label: 'Age Verification Text',
              name: 'ageVerificationText',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.ageVerificationText
            },
            {
              label: 'Enter Button Text',
              name: 'enterButton',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.enterButton
            }
          ]
        },

        {
          name: 'stats_page_phrases',
          label: 'Stats Page Phrases',
          file: 'content/phrases/stats-page-phrases.json',
          fields: [
            {
              label: 'Stats Page Title',
              name: 'statsPageTitle',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.statsPageTitle
            },
            {
              label: 'Stats Header',
              name: 'statsHeader',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.statsHeader
            },
            {
              label: 'Stats Subtitle',
              name: 'statsSubtitle',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.statsSubtitle
            }
          ]
        },

        {
          name: 'lore_page_phrases',
          label: 'Lore Page Phrases',
          file: 'content/phrases/lore-page-phrases.json',
          fields: [
            {
              label: 'Lore Page Title',
              name: 'lorePageTitle',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.lorePageTitle
            }
          ]
        },

        {
          name: 'system_phrases',
          label: 'System Messages',
          file: 'content/phrases/system-phrases.json',
          fields: [
            {
              label: 'Error Messages',
              name: 'loadingError',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.loadingError
            },
            {
              label: 'Encouragement Phrases',
              name: 'encouragement',
              widget: 'list',
              fields: [{ widget: 'string', name: 'phrase' }],
              default: buildTimePhrases.phraseGroups.encouragement
            }
          ]
        }
      ]
    }
  ]
};