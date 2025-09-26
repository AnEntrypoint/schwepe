(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))t(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const s of a.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&t(s)}).observe(document,{childList:!0,subtree:!0});function e(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function t(r){if(r.ep)return;r.ep=!0;const a=e(r);fetch(r.href,a)}})();class c{constructor(){this.loreData=null,this.currentTheme="cyberpunk",this.themes={cyberpunk:{colors:["#f093fb","#f5576c","#4a90e2"],background:"linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",fonts:["Fredoka"]},"neon-noir":{colors:["#ff006e","#8338ec","#3a86ff"],background:"linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",fonts:["Fredoka"]},"cosmic-horror":{colors:["#7209b7","#560bad","#480ca8"],background:"linear-gradient(135deg, #0a0a0a 0%, #1a0033 100%)",fonts:["Fredoka"]},"occult-cyber":{colors:["#c77dff","#e0aaff","#10002b"],background:"linear-gradient(135deg, #240046 0%, #3c096c 100%)",fonts:["Fredoka"]},"cyberpunk-finance":{colors:["#00f5ff","#ff006e","#ffbe0b"],background:"linear-gradient(135deg, #001d3d 0%, #003566 100%)",fonts:["Fredoka"]}}}async init(){try{const o=await fetch("/lore-data.json");this.loreData=await o.json(),console.log("🚀 Lore engine initialized with",this.loreData.length,"chapters")}catch(o){console.error("❌ Failed to load lore data:",o)}}getChapter(o){var e;return(e=this.loreData)==null?void 0:e.find(t=>t.id===o)}getAllChapters(){return this.loreData||[]}getThemeConfig(o){return this.themes[o]||this.themes.cyberpunk}generateLoreHTML(o,e=!1){const t=this.getChapter(o);if(!t)return"<div>Chapter not found</div>";this.getThemeConfig(t.theme);let r=`
      <div class="lore-chapter ${e?"chapter-inline":""}" data-theme="${t.theme}">
        <div class="chapter-header">
          <div class="chapter-icon">${t.icon}</div>
          <h1 class="chapter-title">${t.title}</h1>
          <p class="chapter-subtitle">${t.subtitle}</p>
        </div>

        <div class="chapter-content">
    `;return t.sections.forEach(a=>{r+=this.generateSectionHTML(a)}),r+=`
        </div>
      </div>
    `,r}generateSectionHTML(o){let e=`
      <div class="lore-section section-${o.type}">
        <h2 class="section-title">${o.title}</h2>
        <div class="section-content">
    `;return o.type==="rules"||o.type==="archetypes"||o.type==="hierarchy"?(e+='<ul class="lore-list">',o.content.forEach(t=>{e+=`<li class="lore-item">${t}</li>`}),e+="</ul>"):o.content.forEach(t=>{t.headline&&t.copy&&(e+=`
            <div class="content-block">
              <h3 class="content-headline">${t.headline}</h3>
              <p class="content-copy">${t.copy}</p>
            </div>
          `)}),e+=`
        </div>
      </div>
    `,e}generateNavigationHTML(){const o=this.getAllChapters();let e='<div class="lore-nav">';return o.forEach((t,r)=>{e+=`
        <a href="#${t.id}" class="nav-item" data-chapter="${t.id}">
          <span class="nav-icon">${t.icon}</span>
          <div class="nav-text">
            <div class="nav-title">${t.title}</div>
            <div class="nav-subtitle">${t.subtitle}</div>
          </div>
        </a>
      `}),e+="</div>",e}injectThemeStyles(o){const e=this.getThemeConfig(o),t="dynamic-lore-styles";let r=document.getElementById(t);r||(r=document.createElement("style"),r.id=t,document.head.appendChild(r)),r.textContent=`
      .theme-${o} {
        --primary-color: ${e.colors[0]};
        --secondary-color: ${e.colors[1]};
        --accent-color: ${e.colors[2]};
        --theme-background: ${e.background};
      }

      .lore-chapter[data-theme="${o}"] {
        background: ${e.background};
      }

      .lore-chapter[data-theme="${o}"] .chapter-title {
        color: ${e.colors[0]};
        text-shadow: 0 0 20px ${e.colors[0]}40;
      }

      .lore-chapter[data-theme="${o}"] .section-title {
        color: ${e.colors[1]};
      }

      .lore-chapter[data-theme="${o}"] .content-headline {
        color: ${e.colors[2]};
      }
    `}addChapter(o){this.loreData&&(this.loreData.push(o),this.saveLoreData())}updateChapter(o,e){if(!this.loreData)return;const t=this.loreData.findIndex(r=>r.id===o);t!==-1&&(this.loreData[t]={...this.loreData[t],...e},this.saveLoreData())}removeChapter(o){this.loreData&&(this.loreData=this.loreData.filter(e=>e.id!==o),this.saveLoreData())}saveLoreData(){console.log("📝 Lore data updated:",this.loreData)}searchLore(o){if(!this.loreData)return[];const e=[],t=o.toLowerCase();return this.loreData.forEach(r=>{const a=r.title.toLowerCase().includes(t)||r.subtitle.toLowerCase().includes(t),s=r.sections.some(i=>i.title.toLowerCase().includes(t)||i.content&&i.content.some(n=>n.headline&&n.headline.toLowerCase().includes(t)||n.copy&&n.copy.toLowerCase().includes(t)||typeof n=="string"&&n.toLowerCase().includes(t)));(a||s)&&e.push(r)}),e}getRandomLoreSnippet(){if(!this.loreData)return null;const o=this.loreData[Math.floor(Math.random()*this.loreData.length)],e=o.sections[Math.floor(Math.random()*o.sections.length)];if(e.type==="rules"||e.type==="archetypes"||e.type==="hierarchy")return e.content[Math.floor(Math.random()*e.content.length)];if(e.content.length>0){const t=e.content[Math.floor(Math.random()*e.content.length)];return t.headline||t.copy}return null}}window.loreEngine=new c;document.addEventListener("DOMContentLoaded",()=>{window.loreEngine.init()});
