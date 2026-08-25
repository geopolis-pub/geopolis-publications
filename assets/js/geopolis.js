(() => {
const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500'%3E%3Crect width='100%25' height='100%25' fill='%23e9edf2'/%3E%3C/svg%3E";

const COLLECTIONS = {
  articles: { dir: 'content/articles', files: [
    'first_Article.md',
    'algorithmic-sovereignty-and-india\u2019s-national-security-governance.md',
    'beyond-vulnerability-emerging-economies-as-architects-of-global-climate-governance.md',
    'effectiveness-of-nep-2020-in-higher-educational-institutions-a-study-on-digital-education-and-teacher-training-outcomes-under-sdg-4.md',
    'book-review-how-to-avoid-a-climate-disaster-\u2013-the-solutions-we-have-and-the-breakthroughs-we-need-2.md',
    'the-de-facto-buffer-dilemma-myanmars-civil-war-chinas-strategic-encroachment-and-indias-security-recalibration-in-the-north-east.md'
  ]},
  research: { dir: 'content/dissertations', files: [
    '2023-25-indo-pacific-maritime.md',
    '2024-26-climate-federalism.md'
  ]},
  team: { dir: 'content/team', files: [
    'anand-kumar.md','aparajita-kumari.md','arihant-kapil.md','divya-venkatesh.md','prerna-mishra.md','siddharth-pandey.md'
  ]}
};

function stripQuotes(s){ return (s||'').replace(/^["']|["']$/g,'').trim(); }

function parseFrontmatter(raw){
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if(!m) return {data:{}, body:raw};
  const data = {}; let lastKey=null;
  m[1].split(/\r?\n/).forEach(line=>{
    const arrItem = line.match(/^\s*-\s+(.*)$/);
    if(arrItem && lastKey && (data[lastKey]===null || Array.isArray(data[lastKey]))){
      if(!Array.isArray(data[lastKey])) data[lastKey]=[];
      data[lastKey].push(stripQuotes(arrItem[1]));
      return;
    }
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if(kv){
      lastKey = kv[1];
      let val = kv[2].trim();
      if(val===''){ data[lastKey]=null; }
      else if(val.startsWith('[')&&val.endsWith(']')){
        data[lastKey]=val.slice(1,-1).split(',').map(s=>stripQuotes(s.trim())).filter(Boolean);
      } else {
        data[lastKey]=stripQuotes(val);
      }
    }
  });
  return {data, body:m[2]||''};
}

function mdToHtml(src){
  if(!src) return '';
  const lines = src.split(/\r?\n/);
  let html='', inList=false, listType=null, inCode=false, para=[];
  const inlineFmt = t => t
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img loading="lazy" alt="$1" src="$2">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g,'<em>$1</em>')
    .replace(/`([^`]+)`/g,'<code>$1</code>');
  const flush = () => { if(para.length){ html+='<p>'+inlineFmt(para.join(' '))+'</p>\n'; para=[]; } };
  const closeList = () => { if(inList){ html += listType==='ul'?'</ul>\n':'</ol>\n'; inList=false; } };
  lines.forEach(line=>{
    if(/^```/.test(line)){ flush(); closeList(); inCode=!inCode; html+= inCode?'<pre><code>':'</code></pre>\n'; return; }
    if(inCode){ html+= line.replace(/</g,'&lt;')+'\n'; return; }
    if(/^\s*$/.test(line)){ flush(); closeList(); return; }
    let m;
    if((m=line.match(/^(#{1,6})\s+(.*)$/))){ flush(); closeList(); const l=m[1].length; html+='<h'+l+'>'+inlineFmt(m[2])+'</h'+l+'>\n'; return; }
    if((m=line.match(/^>\s?(.*)$/))){ flush(); closeList(); html+='<blockquote><p>'+inlineFmt(m[1])+'</p></blockquote>\n'; return; }
    if((m=line.match(/^[-*]\s+(.*)$/))){ flush(); if(!inList||listType!=='ul'){closeList();html+='<ul>\n';inList=true;listType='ul';} html+='<li>'+inlineFmt(m[1])+'</li>\n'; return; }
    if((m=line.match(/^\d+\.\s+(.*)$/))){ flush(); if(!inList||listType!=='ol'){closeList();html+='<ol>\n';inList=true;listType='ol';} html+='<li>'+inlineFmt(m[1])+'</li>\n'; return; }
    para.push(line.trim());
  });
  flush(); closeList();
  return html;
}

function filenameToTitle(f){ return f.replace(/\.md$/,'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim().replace(/\b\w/g,c=>c.toUpperCase()); }
function getTitle(d,f){ return d.title||d.Title||filenameToTitle(f); }
function getAuthor(d){ return d.author||d.Author||d.author_name||'GEOPOLIS Desk'; }
function getDate(d){ return d.date||d.Date||d.publish_date||d.pubDate||d.published||null; }
function getCategory(d){ let c=d.category||d.Category||d.categories; if(Array.isArray(c)) c=c[0]; return c||'General'; }
function getTags(d){ let t=d.tags||d.Tags||[]; return Array.isArray(t)?t:(t?[t]:[]); }
function getImage(d){ return d.image||d.cover_image||d.thumbnail||d.featured_image||d.cover||null; }
function getExcerpt(d,body){ return d.excerpt||d.description||d.summary|| (body.replace(/[#>*`_\[\]!]/g,'').trim().slice(0,170)+'\u2026'); }
function formatDate(d){ if(!d) return ''; const dt=new Date(d); if(isNaN(dt)) return d; return dt.toLocaleDateString('en-IN',{year:'numeric',month:'long',day:'numeric'}); }
function slugParam(collection,filename){ return 'article.html?c='+encodeURIComponent(collection)+'&f='+encodeURIComponent(filename); }
function escapeHtml(s){ return (s||'').toString().replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

async function loadEntry(collectionKey, filename){
  const col = COLLECTIONS[collectionKey];
  const url = col.dir+'/'+encodeURIComponent(filename);
  const res = await fetch(url);
  if(!res.ok) throw new Error('missing '+url);
  const raw = await res.text();
  const {data, body} = parseFrontmatter(raw);
  return {
    collection:collectionKey, filename, data, body,
    title:getTitle(data,filename), author:getAuthor(data), date:getDate(data),
    category:getCategory(data), tags:getTags(data), image:getImage(data)||FALLBACK_IMG,
    excerpt:getExcerpt(data,body)
  };
}
async function loadCollection(key){
  const col = COLLECTIONS[key];
  const settled = await Promise.allSettled(col.files.map(f=>loadEntry(key,f)));
  return settled.filter(r=>r.status==='fulfilled').map(r=>r.value)
    .sort((a,b)=> new Date(b.date||0)-new Date(a.date||0));
}

function cardHtml(e){
  return '<article class="card">'+
    '<a href="'+slugParam(e.collection,e.filename)+'"><img src="'+e.image+'" alt="'+escapeHtml(e.title)+'"></a>'+
    '<span class="category-tag">'+escapeHtml(e.category)+'</span>'+
    '<h3><a href="'+slugParam(e.collection,e.filename)+'">'+escapeHtml(e.title)+'</a></h3>'+
    '<p>'+escapeHtml(e.excerpt)+'</p>'+
    '<p class="meta">'+escapeHtml(e.author)+(e.date? ' \u00b7 '+formatDate(e.date):'')+'</p>'+
  '</article>';
}
function authorCardHtml(e){
  const name = e.data.name || e.title;
  return '<a class="author-card" href="author.html?f='+encodeURIComponent(e.filename)+'">'+
    '<img src="'+FALLBACK_IMG+'" alt="'+escapeHtml(name)+'">'+
    '<h3>'+escapeHtml(name)+'</h3>'+
    '<p>'+escapeHtml(e.data.affiliation||e.data.institution||'')+'</p>'+
  '</a>';
}

async function injectPartials(){
  const [h,f] = await Promise.all([
    fetch('partials/header.html').then(r=>r.text()).catch(()=> ''),
    fetch('partials/footer.html').then(r=>r.text()).catch(()=> '')
  ]);
  const hEl = document.getElementById('site-header');
  const fEl = document.getElementById('site-footer');
  if(hEl) hEl.innerHTML = h;
  if(fEl) fEl.innerHTML = f;
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');
  if(toggle && nav) toggle.addEventListener('click', ()=> nav.classList.toggle('open'));
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('#mainNav a').forEach(a=>{
    if(a.getAttribute('href')===path) a.style.color = 'var(--crimson)';
  });
}

async function renderHome(){
  const [articles, research, team] = await Promise.all([loadCollection('articles'), loadCollection('research'), loadCollection('team')]);
  if(!articles.length) return;
  const featured = articles[0];
  const rest = articles.slice(1);
  const heroFeatured = document.getElementById('hero-featured');
  if(heroFeatured) heroFeatured.innerHTML =
    '<a href="'+slugParam(featured.collection,featured.filename)+'"><img src="'+featured.image+'" alt="'+escapeHtml(featured.title)+'"></a>'+
    '<span class="category-tag">'+escapeHtml(featured.category)+'</span>'+
    '<h1><a href="'+slugParam(featured.collection,featured.filename)+'">'+escapeHtml(featured.title)+'</a></h1>'+
    '<p class="hero-excerpt">'+escapeHtml(featured.excerpt)+'</p>'+
    '<p class="meta">'+escapeHtml(featured.author)+(featured.date? ' \u00b7 '+formatDate(featured.date):'')+'</p>';
  const heroSide = document.getElementById('hero-side');
  if(heroSide) heroSide.innerHTML = rest.slice(0,3).map(e=>
    '<div class="side-item"><a href="'+slugParam(e.collection,e.filename)+'"><img src="'+e.image+'" alt="'+escapeHtml(e.title)+'"></a>'+
    '<div><span class="category-tag">'+escapeHtml(e.category)+'</span><h3><a href="'+slugParam(e.collection,e.filename)+'">'+escapeHtml(e.title)+'</a></h3><p class="meta">'+formatDate(e.date)+'</p></div></div>'
  ).join('');
  const latest = document.getElementById('latest-grid');
  if(latest) latest.innerHTML = articles.slice(0,6).map(cardHtml).join('') || '<p class="empty-state">No articles yet.</p>';
  const analysisGrid = document.getElementById('analysis-grid');
  if(analysisGrid){
    const filtered = articles.filter(a=>/analysis/i.test(a.category));
    analysisGrid.innerHTML = (filtered.length?filtered:articles).slice(0,3).map(cardHtml).join('');
  }
  const researchGrid = document.getElementById('research-grid');
  if(researchGrid) researchGrid.innerHTML = research.map(cardHtml).join('') || '<p class="empty-state">No research entries yet.</p>';
  const authorsPreview = document.getElementById('authors-preview');
  if(authorsPreview) authorsPreview.innerHTML = team.slice(0,4).map(authorCardHtml).join('');
}

async function renderCategory(){
  const target = document.body.dataset.category;
  const articles = await loadCollection('articles');
  const filtered = articles.filter(a=> (a.category||'').toLowerCase().includes(target.toLowerCase()) || (a.tags||[]).some(t=>t.toLowerCase().includes(target.toLowerCase())));
  const grid = document.getElementById('cat-grid');
  const empty = document.getElementById('cat-empty');
  if(filtered.length){ grid.innerHTML = filtered.map(cardHtml).join(''); } else if(empty){ empty.style.display='block'; }
}
async function renderResearchPage(){
  const research = await loadCollection('research');
  const grid = document.getElementById('cat-grid');
  const empty = document.getElementById('cat-empty');
  if(research.length){ grid.innerHTML = research.map(cardHtml).join(''); } else if(empty){ empty.style.display='block'; }
}

async function renderArticle(){
  const params = new URLSearchParams(location.search);
  const c = params.get('c')||'articles';
  const f = params.get('f');
  if(!f){ document.getElementById('a-title').textContent='Article not found'; return; }
  let entry;
  try{ entry = await loadEntry(c,f); } catch(e){ document.getElementById('a-title').textContent='Article could not be loaded'; return; }
  document.getElementById('doc-title').textContent = entry.title+' \u2014 GEOPOLIS';
  document.getElementById('meta-desc').setAttribute('content', entry.excerpt);
  document.getElementById('og-title').setAttribute('content', entry.title);
  document.getElementById('og-desc').setAttribute('content', entry.excerpt);
  const canonicalUrl = location.origin+location.pathname+'?c='+encodeURIComponent(c)+'&f='+encodeURIComponent(f);
  document.getElementById('canonical').setAttribute('href', canonicalUrl);
  document.getElementById('a-category').textContent = entry.category;
  document.getElementById('a-title').textContent = entry.title;
  document.getElementById('a-excerpt').textContent = entry.excerpt;
  document.getElementById('a-meta').textContent = entry.author+(entry.date? ' \u00b7 '+formatDate(entry.date):'');
  const img = document.getElementById('a-image');
  if(entry.image){ img.src = entry.image; img.alt = entry.title; } else { img.style.display='none'; }
  document.getElementById('a-body').innerHTML = mdToHtml(entry.body);
  document.getElementById('a-tags').innerHTML = entry.tags.map(t=>'<span class="tag">'+escapeHtml(t)+'</span>').join('');
  document.getElementById('a-authorbox').innerHTML = '<img src="'+FALLBACK_IMG+'" alt=""><div><strong>'+escapeHtml(entry.author)+'</strong><p class="meta">Contributor, GEOPOLIS</p></div>';
  document.getElementById('a-share').innerHTML =
    '<a href="https://twitter.com/intent/tweet?url='+encodeURIComponent(canonicalUrl)+'&text='+encodeURIComponent(entry.title)+'" target="_blank" rel="noopener">Share on X</a>'+
    '<a href="https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(canonicalUrl)+'" target="_blank" rel="noopener">Share on LinkedIn</a>'+
    '<a href="https://wa.me/?text='+encodeURIComponent(entry.title+' '+canonicalUrl)+'" target="_blank" rel="noopener">Share on WhatsApp</a>';
  try{
    const jsonld = document.createElement('script');
    jsonld.type = 'application/ld+json';
    jsonld.textContent = JSON.stringify({
      "@context":"https://schema.org","@type":"NewsArticle",
      "headline":entry.title,"description":entry.excerpt,
      "author":{"@type":"Person","name":entry.author},
      "datePublished":entry.date||undefined,"image":entry.image||undefined
    });
    document.head.appendChild(jsonld);
  }catch(e){}
  const all = await loadCollection('articles');
  const related = all.filter(a=> a.filename!==entry.filename && a.category===entry.category).slice(0,3);
  const finalRelated = related.length?related:all.filter(a=>a.filename!==entry.filename).slice(0,3);
  const relGrid = document.getElementById('related-grid');
  if(relGrid) relGrid.innerHTML = finalRelated.map(cardHtml).join('');
}

async function renderAuthors(){
  const team = await loadCollection('team');
  const grid = document.getElementById('authors-grid');
  if(grid) grid.innerHTML = team.map(authorCardHtml).join('') || '<p class="empty-state">No authors listed yet.</p>';
}
async function renderAuthorProfile(){
  const params = new URLSearchParams(location.search);
  const f = params.get('f');
  const team = await loadCollection('team');
  const person = team.find(t=>t.filename===f);
  const header = document.getElementById('author-header');
  if(!person){ if(header) header.innerHTML = '<h1>Author not found</h1>'; return; }
  const name = person.data.name || person.title;
  if(header) header.innerHTML =
    '<h1>'+escapeHtml(name)+'</h1>'+
    '<p>'+escapeHtml(person.data.affiliation||person.data.institution||'')+'</p>'+
    '<p class="meta">'+escapeHtml(person.body||'')+'</p>';
  const articles = await loadCollection('articles');
  const mine = articles.filter(a=> (a.author||'').toLowerCase().includes(name.toLowerCase()));
  const grid = document.getElementById('author-articles');
  if(grid) grid.innerHTML = mine.map(cardHtml).join('') || '<p class="empty-state">No published articles found for this author yet.</p>';
}

async function renderSearch(){
  const params = new URLSearchParams(location.search);
  const q = (params.get('q')||'').toLowerCase();
  const input = document.getElementById('searchInput');
  if(input) input.value = params.get('q')||'';
  const [articles, research] = await Promise.all([loadCollection('articles'), loadCollection('research')]);
  const all = [...articles, ...research];
  const results = q ? all.filter(e=> [e.title,e.author,e.category,(e.tags||[]).join(' '),e.body].join(' ').toLowerCase().includes(q)) : all;
  const resultsEl = document.getElementById('search-results');
  if(resultsEl) resultsEl.innerHTML = results.map(cardHtml).join('') || '<p class="empty-state">No results found.</p>';
  const form = document.getElementById('searchForm');
  if(form) form.addEventListener('submit', e=>{ e.preventDefault(); const val=document.getElementById('searchInput').value; location.href='search.html?q='+encodeURIComponent(val); });
}

document.addEventListener('DOMContentLoaded', async ()=>{
  await injectPartials();
  const page = document.body.dataset.page;
  try{
    if(page==='home') await renderHome();
    else if(page==='article') await renderArticle();
    else if(page==='category') await renderCategory();
    else if(page==='research') await renderResearchPage();
    else if(page==='authors') await renderAuthors();
    else if(page==='author-profile') await renderAuthorProfile();
    else if(page==='search') await renderSearch();
  }catch(err){ console.error(err); }
});
})();