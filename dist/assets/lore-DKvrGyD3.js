(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))o(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const s of a.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&o(s)}).observe(document,{childList:!0,subtree:!0});function e(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function o(r){if(r.ep)return;r.ep=!0;const a=e(r);fetch(r.href,a)}})();class c{constructor(){this.loreData=null,this.currentTheme="cyberpunk",this.themes={cyberpunk:{colors:["#f093fb","#f5576c","#4a90e2"],background:"linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",fonts:["Fredoka"]},"neon-noir":{colors:["#ff006e","#8338ec","#3a86ff"],background:"linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",fonts:["Fredoka"]},"cosmic-horror":{colors:["#7209b7","#560bad","#480ca8"],background:"linear-gradient(135deg, #0a0a0a 0%, #1a0033 100%)",fonts:["Fredoka"]},"occult-cyber":{colors:["#c77dff","#e0aaff","#10002b"],background:"linear-gradient(135deg, #240046 0%, #3c096c 100%)",fonts:["Fredoka"]},"cyberpunk-finance":{colors:["#00f5ff","#ff006e","#ffbe0b"],background:"linear-gradient(135deg, #001d3d 0%, #003566 100%)",fonts:["Fredoka"]}}}async init(){try{const t=await fetch("/lore-data.json");this.loreData=await t.json(),console.log("🚀 Lore engine initialized with",this.loreData.length,"chapters")}catch(t){console.error("❌ Failed to load lore data:",t)}}getChapter(t){var e;return(e=this.loreData)==null?void 0:e.find(o=>o.id===t)}getAllChapters(){return this.loreData||[]}getThemeConfig(t){return this.themes[t]||this.themes.cyberpunk}generateLoreHTML(t){const e=this.getChapter(t);if(!e)return"<div>Chapter not found</div>";this.getThemeConfig(e.theme);let o=`
      <div class="lore-chapter" data-theme="${e.theme}">
        <div class="chapter-header">
          <div class="chapter-icon">${e.icon}</div>
          <h1 class="chapter-title">${e.title}</h1>
          <p class="chapter-subtitle">${e.subtitle}</p>
        </div>

        <div class="chapter-content">
    `;return e.sections.forEach(r=>{o+=this.generateSectionHTML(r)}),o+=`
        </div>
      </div>
    `,o}generateSectionHTML(t){let e=`
      <div class="lore-section section-${t.type}">
        <h2 class="section-title">${t.title}</h2>
        <div class="section-content">
    `;return t.type==="rules"||t.type==="archetypes"||t.type==="hierarchy"?(e+='<ul class="lore-list">',t.content.forEach(o=>{e+=`<li class="lore-item">${o}</li>`}),e+="</ul>"):t.content.forEach(o=>{o.headline&&o.copy&&(e+=`
            <div class="content-block">
              <h3 class="content-headline">${o.headline}</h3>
              <p class="content-copy">${o.copy}</p>
            </div>
          `)}),e+=`
        </div>
      </div>
    `,e}generateNavigationHTML(){const t=this.getAllChapters();let e='<div class="lore-nav">';return t.forEach((o,r)=>{e+=`
        <a href="#${o.id}" class="nav-item" data-chapter="${o.id}">
          <span class="nav-icon">${o.icon}</span>
          <div class="nav-text">
            <div class="nav-title">${o.title}</div>
            <div class="nav-subtitle">${o.subtitle}</div>
          </div>
        </a>
      `}),e+="</div>",e}injectThemeStyles(t){const e=this.getThemeConfig(t),o="dynamic-lore-styles";let r=document.getElementById(o);r||(r=document.createElement("style"),r.id=o,document.head.appendChild(r)),r.textContent=`
      .theme-${t} {
        --primary-color: ${e.colors[0]};
        --secondary-color: ${e.colors[1]};
        --accent-color: ${e.colors[2]};
        --theme-background: ${e.background};
      }

      .lore-chapter[data-theme="${t}"] {
        background: ${e.background};
      }

      .lore-chapter[data-theme="${t}"] .chapter-title {
        color: ${e.colors[0]};
        text-shadow: 0 0 20px ${e.colors[0]}40;
      }

      .lore-chapter[data-theme="${t}"] .section-title {
        color: ${e.colors[1]};
      }

      .lore-chapter[data-theme="${t}"] .content-headline {
        color: ${e.colors[2]};
      }
    `}addChapter(t){this.loreData&&(this.loreData.push(t),this.saveLoreData())}updateChapter(t,e){if(!this.loreData)return;const o=this.loreData.findIndex(r=>r.id===t);o!==-1&&(this.loreData[o]={...this.loreData[o],...e},this.saveLoreData())}removeChapter(t){this.loreData&&(this.loreData=this.loreData.filter(e=>e.id!==t),this.saveLoreData())}saveLoreData(){console.log("📝 Lore data updated:",this.loreData)}searchLore(t){if(!this.loreData)return[];const e=[],o=t.toLowerCase();return this.loreData.forEach(r=>{const a=r.title.toLowerCase().includes(o)||r.subtitle.toLowerCase().includes(o),s=r.sections.some(i=>i.title.toLowerCase().includes(o)||i.content&&i.content.some(n=>n.headline&&n.headline.toLowerCase().includes(o)||n.copy&&n.copy.toLowerCase().includes(o)||typeof n=="string"&&n.toLowerCase().includes(o)));(a||s)&&e.push(r)}),e}getRandomLoreSnippet(){if(!this.loreData)return null;const t=this.loreData[Math.floor(Math.random()*this.loreData.length)],e=t.sections[Math.floor(Math.random()*t.sections.length)];if(e.type==="rules"||e.type==="archetypes"||e.type==="hierarchy")return e.content[Math.floor(Math.random()*e.content.length)];if(e.content.length>0){const o=e.content[Math.floor(Math.random()*e.content.length)];return o.headline||o.copy}return null}}window.loreEngine=new c;document.addEventListener("DOMContentLoaded",()=>{window.loreEngine.init()});
