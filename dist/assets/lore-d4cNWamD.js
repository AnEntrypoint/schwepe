import"./modulepreload-polyfill-B5Qt9EMX.js";class l{constructor(){this.loreData=null,this.currentTheme="cyberpunk",this.themes={cyberpunk:{colors:["#f093fb","#f5576c","#4a90e2"],background:"linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",fonts:["Fredoka"]},"neon-noir":{colors:["#ff006e","#8338ec","#3a86ff"],background:"linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",fonts:["Fredoka"]},"cosmic-horror":{colors:["#7209b7","#560bad","#480ca8"],background:"linear-gradient(135deg, #0a0a0a 0%, #1a0033 100%)",fonts:["Fredoka"]},"occult-cyber":{colors:["#c77dff","#e0aaff","#10002b"],background:"linear-gradient(135deg, #240046 0%, #3c096c 100%)",fonts:["Fredoka"]},"cyberpunk-finance":{colors:["#00f5ff","#ff006e","#ffbe0b"],background:"linear-gradient(135deg, #001d3d 0%, #003566 100%)",fonts:["Fredoka"]}}}async init(){try{const a=await fetch("/lore-data.json");this.loreData=await a.json(),console.log("🚀 Lore engine initialized with",this.loreData.length,"chapters")}catch(a){console.error("❌ Failed to load lore data:",a)}}getChapter(a){var e;return(e=this.loreData)==null?void 0:e.find(t=>t.id===a)}getAllChapters(){return this.loreData||[]}getThemeConfig(a){return this.themes[a]||this.themes.cyberpunk}generateLoreHTML(a,e=!1){const t=this.getChapter(a);if(!t)return"<div>Chapter not found</div>";this.getThemeConfig(t.theme);let o=`
      <div class="lore-chapter ${e?"chapter-inline":""}" data-theme="${t.theme}">
        <div class="chapter-header">
          <div class="chapter-icon">${t.icon}</div>
          <h1 class="chapter-title">${t.title}</h1>
          <p class="chapter-subtitle">${t.subtitle}</p>
        </div>

        <div class="chapter-content">
    `;return t.sections.forEach(n=>{o+=this.generateSectionHTML(n)}),o+=`
        </div>
      </div>
    `,o}generateSectionHTML(a){let e=`
      <div class="lore-section section-${a.type}">
        <h2 class="section-title">${a.title}</h2>
        <div class="section-content">
    `;return a.type==="rules"||a.type==="archetypes"||a.type==="hierarchy"?(e+='<ul class="lore-list">',a.content.forEach(t=>{e+=`<li class="lore-item">${t}</li>`}),e+="</ul>"):a.content.forEach(t=>{t.headline&&t.copy&&(e+=`
            <div class="content-block">
              <h3 class="content-headline">${t.headline}</h3>
              <p class="content-copy">${t.copy}</p>
            </div>
          `)}),e+=`
        </div>
      </div>
    `,e}generateNavigationHTML(){const a=this.getAllChapters();let e='<div class="lore-nav">';return a.forEach((t,o)=>{e+=`
        <a href="#${t.id}" class="nav-item" data-chapter="${t.id}">
          <span class="nav-icon">${t.icon}</span>
          <div class="nav-text">
            <div class="nav-title">${t.title}</div>
            <div class="nav-subtitle">${t.subtitle}</div>
          </div>
        </a>
      `}),e+="</div>",e}injectThemeStyles(a){const e=this.getThemeConfig(a),t="dynamic-lore-styles";let o=document.getElementById(t);o||(o=document.createElement("style"),o.id=t,document.head.appendChild(o)),o.textContent=`
      .theme-${a} {
        --primary-color: ${e.colors[0]};
        --secondary-color: ${e.colors[1]};
        --accent-color: ${e.colors[2]};
        --theme-background: ${e.background};
      }

      .lore-chapter[data-theme="${a}"] {
        background: ${e.background};
      }

      .lore-chapter[data-theme="${a}"] .chapter-title {
        color: ${e.colors[0]};
        text-shadow: 0 0 20px ${e.colors[0]}40;
      }

      .lore-chapter[data-theme="${a}"] .section-title {
        color: ${e.colors[1]};
      }

      .lore-chapter[data-theme="${a}"] .content-headline {
        color: ${e.colors[2]};
      }
    `}addChapter(a){this.loreData&&(this.loreData.push(a),this.saveLoreData())}updateChapter(a,e){if(!this.loreData)return;const t=this.loreData.findIndex(o=>o.id===a);t!==-1&&(this.loreData[t]={...this.loreData[t],...e},this.saveLoreData())}removeChapter(a){this.loreData&&(this.loreData=this.loreData.filter(e=>e.id!==a),this.saveLoreData())}saveLoreData(){console.log("📝 Lore data updated:",this.loreData)}searchLore(a){if(!this.loreData)return[];const e=[],t=a.toLowerCase();return this.loreData.forEach(o=>{const n=o.title.toLowerCase().includes(t)||o.subtitle.toLowerCase().includes(t),i=o.sections.some(s=>s.title.toLowerCase().includes(t)||s.content&&s.content.some(r=>r.headline&&r.headline.toLowerCase().includes(t)||r.copy&&r.copy.toLowerCase().includes(t)||typeof r=="string"&&r.toLowerCase().includes(t)));(n||i)&&e.push(o)}),e}getRandomLoreSnippet(){if(!this.loreData)return null;const a=this.loreData[Math.floor(Math.random()*this.loreData.length)],e=a.sections[Math.floor(Math.random()*a.sections.length)];if(e.type==="rules"||e.type==="archetypes"||e.type==="hierarchy")return e.content[Math.floor(Math.random()*e.content.length)];if(e.content.length>0){const t=e.content[Math.floor(Math.random()*e.content.length)];return t.headline||t.copy}return null}}window.loreEngine=new l;document.addEventListener("DOMContentLoaded",()=>{window.loreEngine.init()});
