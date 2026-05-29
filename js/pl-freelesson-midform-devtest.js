(function(){
'use strict';
var _gel=function(id){return document.getElementById(id);};
function _loadFABrands(){
if(document.querySelector('link[href*="font-awesome"]')) return;
const l=document.createElement('link');l.rel='stylesheet';
l.href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
document.head.appendChild(l);
}
const C = {
forceOnline: false,
autoSelectCourse:false,
_proxy: 'https://blue-tree-483b.ppienkowski.workers.dev',
get api(){ const P=this._proxy; const M=this.market||'pl'; return {
cities: `${P}/${M}/${this.courseKindStationary||"SEMESTER_STATIONARY"}/cities`,
citiesForAge: age=>`${P}/${M}/${this.courseKindStationary||"SEMESTER_STATIONARY"}/cities/age/${age}`,
locations: `${P}/${M}/locations`,
coursesOnline: `${P}/${M}/courses/online/${this.courseKindOnline||"DEMO_DIAGNOSTIC_ONLINE_LESSON"}`,
coursesByLoc: id=>`${P}/${M}/courses/stationary/${this.courseKindStationary||"SEMESTER_STATIONARY"}/${id}`,
timetableOnline: id=>`${P}/${M}/timetable/online/${this.courseKindOnline||"DEMO_DIAGNOSTIC_ONLINE_LESSON"}/${id}`,
timetableStationary: (id,loc)=>`${P}/${M}/timetable/stationary/${this.courseKindStationary||"SEMESTER_STATIONARY"}/${id}/${loc}`,
};},
get registrationApiUrl(){ return this._proxy+'/'+( this.market||'pl')+'/register'; },
recaptchaSiteKey: '6Lf8n1kpAAAAADvC2Kzig4MEm-3VJS2ojJdHnQHd',
portalId: '47809621',
formId: '6eeb070b-832b-4aa9-87e5-772dfba602d9',
cacheKey: {
cities: 'ms_hsxcg_cities',
citiesAge: age=>`ms_hsxcg_cities_age_${age}`,
coursesOnline: 'ms_hsxcg_courses_online',
coursesLoc: id=>`ms_hsxcg_courses_loc_${id}`,
},
market: 'pl',
courseKindOnline: 'DEMO_DIAGNOSTIC_ONLINE_LESSON',
courseKindStationary: 'DEMO_STATIONARY_FREE_LESSON',
country: 'pl',
phoneUrl: 'https://codinggiantsphoneapp.netlify.app/.netlify/functions/validate-phone',
courseNameStrip:{enabled:true,phrases:['Darmowa lekcja próbna - ','Darmowa lekcja próbna- ',' online',' Online']},
fieldStudentName:'student_name',
fieldStudentSurname:'student_surname',
i18n:window._msI18n||{}
};
const lang=(()=>{const sup=Object.keys(C.i18n);for(const s of[document.documentElement.lang||'',navigator.language||'']){const c=s.split('-')[0].toLowerCase();if(sup.includes(c))return c;}return'pl';})();
const T=C.i18n[lang]||C.i18n[Object.keys(C.i18n)[0]]||{};
function applyI18n(){document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.getAttribute('data-i18n');if(T[k]!==undefined)el.textContent=typeof T[k]==='function'?T[k](1):T[k];});}
const _c=k=>{try{const v=sessionStorage.getItem(k);return v?JSON.parse(v):null;}catch(e){return null;}};
const _s=(k,d)=>{try{sessionStorage.setItem(k,JSON.stringify(d));}catch(e){}};
async function apiFetch(url,_retry=0){try{const r=await fetch(url,{headers:{'Accept':'application/json'}});if(r.status===503&&_retry<2){await new Promise(res=>setTimeout(res,600*(_retry+1)));return apiFetch(url,_retry+1);}if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();}catch(e){if(_retry<2&&!String(e).includes('HTTP')){await new Promise(res=>setTimeout(res,600*(_retry+1)));return apiFetch(url,_retry+1);}throw e;}}
function stripCourseName(name){
if(!C.courseNameStrip.enabled||!name)return name;
let n=name;
C.courseNameStrip.phrases.forEach(p=>{n=n.split(p).join('');});
return n.trim();
}
function ageFromYear(y){return new Date().getFullYear()-+y;}
function parseAgeGroup(str){const m=str.match(/(\d+)(?:-(\d+))?/);return m?{min:+m[1],max:+(m[2]||m[1])}:null;}
function matchGroups(col,age){return col.filter(g=>{const r=parseAgeGroup(g.age||'');return r&&age>=r.min&&age<=r.max;});}
function parseDate(s){let d,m,y;if(s.includes('/')){[d,m,y]=s.split('/').map(Number);}else{[d,m,y]=s.split('.').map(Number);}return new Date(y,m-1,d);}
function dateKey(d){return`${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;}
function isoToICS(ds,ts){const[d,mo,y]=ds.split('.');const[h,mi]=ts.split(':');return`${y}${mo}${d}T${h}${mi}00`;}
function getLiveBirthYear(){
const el=document.querySelector('#hubspot-form-wrapper input[name="studentbirthyear"],#hubspot-form-wrapper input[name="studentyear"]');
return el?el.value:(savedFormData.studentbirthyear||'');
}
function getLiveAge(){const y=getLiveBirthYear();return(y&&String(y).length===4)?ageFromYear(y):null;}
let selectedMode=null,selectedCity=null,selectedLocId=null,_autoSelectedCourse=false;
let _captchaToken=null;
let _hsSubmitOk=false;
let selectedCourseId=null,selectedCourseIds=[],selectedCourseName=null,selectedCourseData=null,selectedAgeGroup=null;
let selectedDateStr=null,selectedSlotId=null,selectedSlotData=null;
let savedFormData={},$hsForm=null;
let allCities=[],slotsByDate={},slotsForDate=[],slotsShown=9;
let calYear=null,calMonth=null;
function updateProgress(step){
_gel('ms-progress').style.display=(step>=2&&step<=3)?'flex':'none';
[1,2,3].forEach(i=>{const it=_gel('prog-'+i);it.classList.remove('done','active');if(i<step)it.classList.add('done');else if(i===step)it.classList.add('active');});
[1,2].forEach(i=>{const ln=_gel('prog-line-'+i);if(ln)ln.classList.toggle('active',i<step);});
}
function msGoStep(step){
const _gtmMap={2:'MFonLP_course',3:'MFonLP_date',4:'MFonLP_thx'};
if(_gtmMap[step])_gtm(_gtmMap[step]);
document.querySelectorAll('.ms-step').forEach(el=>el.classList.remove('active'));
const el=_gel('ms-step-'+step);
void el.offsetWidth;
el.classList.add('active');
updateProgress(step);
_toggleSurroundingEls(step);
(()=>{const el=_gel('ms-container');if(!el)return;const y=el.getBoundingClientRect().top+window.scrollY-5*parseFloat(getComputedStyle(document.documentElement).fontSize);window.scrollTo({top:y,behavior:'smooth'});})();
if(step===3)loadSlots();
if(step===4)buildConfirmationScreen();
}
window.msGoStep=msGoStep;
function _toggleSurroundingEls(step){
var hide=step>=2;
['before-form','after-form'].forEach(function(id){
var el=_gel(id);
if(!el)return;
el.style.transition='opacity .35s ease, max-height .4s ease';
el.style.overflow='hidden';
if(hide){
el.style.opacity='0';
el.style.maxHeight='0';
el.style.pointerEvents='none';
el.style.display='none';
}else{
el.style.display='';
el.style.opacity='1';
el.style.maxHeight=el.scrollHeight+'px';
el.style.pointerEvents='';
setTimeout(function(){if(el.style.opacity==='1'){el.style.maxHeight='';el.style.overflow='';}},450);
}
});
}
async function prefetchCities(){
const cached=_c(C.cacheKey.cities);
if(cached){allCities=cached;return;}
try{const data=await apiFetch(C.api.cities);allCities=Array.isArray(data)?data:[];_s(C.cacheKey.cities,allCities);}
catch(e){console.warn('[MS] Cities failed',e);}
}
async function loadCitiesForAge(age){
if(!age){return;}
const cacheKey=C.cacheKey.citiesAge(age);
const cached=_c(cacheKey);
if(cached){allCities=cached;return;}
try{
const data=await apiFetch(C.api.citiesForAge(age));
if(Array.isArray(data)&&data.length>0){
allCities=data;
_s(cacheKey,allCities);
}
}catch(e){
console.warn('[MS] citiesForAge failed, using full list',e);
}
}
let _cityTimer=null,_hlIdx=-1,_dropData=[];
function initCitySearch(){
const inp=_gel('ms-city-input');
const drop=_gel('ms-city-dropdown');
if(!inp||!drop)return;
inp.addEventListener('focus',()=>{
if(allCities.length>0&&allCities.length<=15&&!inp.value.trim()){
renderDrop(allCities.slice(0,15),'');
}
});
inp.addEventListener('input',()=>{
clearTimeout(_cityTimer);
if(selectedCity&&inp.value!==selectedCity){selectedCity=null;selectedLocId=null;refreshStep1Btn();}
const q=inp.value.trim();
if(!q){
if(allCities.length<=15) renderDrop(allCities.slice(0,15),'');
else hideDrop();
return;
}
if(q.length<2){hideDrop();return;}
_cityTimer=setTimeout(()=>searchCities(q),120);
});
inp.addEventListener('keydown',ev=>{
if(!drop.classList.contains('open'))return;
if(ev.key==='ArrowDown'){ev.preventDefault();moveHL(1);}
else if(ev.key==='ArrowUp'){ev.preventDefault();moveHL(-1);}
else if(ev.key==='Enter'&&_hlIdx>=0){ev.preventDefault();pickCity(_dropData[_hlIdx]);}
else if(ev.key==='Escape')hideDrop();
});
inp.addEventListener('blur',()=>{
setTimeout(()=>{
hideDrop();
if(inp.value.trim()&&!selectedCity){inp.classList.add('ms-error');const e=_gel('ms-city-err');if(e)e.style.display='block';}
},180);
});
}
function searchCities(q){
const ql=q.toLowerCase();
const res=allCities.filter(c=>c.city.toLowerCase().includes(ql))
.sort((a,b)=>{const as=a.city.toLowerCase().startsWith(ql),bs=b.city.toLowerCase().startsWith(ql);return(bs?1:0)-(as?1:0)||a.city.localeCompare(b.city,'pl');})
.slice(0,8);
renderDrop(res,q);
}
function renderDrop(cities,q){
const drop=_gel('ms-city-dropdown');
_hlIdx=-1;drop.innerHTML='';
if(!cities.length){drop.innerHTML=`<div class="ms-city-empty">${T.cityEmpty}</div>`;_dropData=[];drop.classList.add('open');return;}
_dropData=cities;
cities.forEach((c,i)=>{
const div=document.createElement('div');div.className='ms-city-option';
div.innerHTML=hlMatch(c.city,q);
div.addEventListener('mousedown',ev=>{ev.preventDefault();pickCity(c);});
div.addEventListener('mouseover',()=>{_hlIdx=i;drop.querySelectorAll('.ms-city-option').forEach((el,j)=>el.classList.toggle('ms-hl',j===i));});
drop.appendChild(div);
});
drop.classList.add('open');
}
function hlMatch(n,q){const idx=n.toLowerCase().indexOf(q.toLowerCase());return idx===-1?n:n.slice(0,idx)+`<mark>${n.slice(idx,idx+q.length)}</mark>`+n.slice(idx+q.length);}
function moveHL(dir){const items=document.querySelectorAll('#ms-city-dropdown .ms-city-option');if(!items.length)return;_hlIdx=Math.max(0,Math.min(items.length-1,_hlIdx+dir));items.forEach((el,i)=>el.classList.toggle('ms-hl',i===_hlIdx));}
function hideDrop(){const drop=_gel('ms-city-dropdown');if(drop){drop.classList.remove('open');drop.innerHTML='';} _dropData=[];_hlIdx=-1;}
async function pickCity(c){
_autoSelectedCourse=false;
selectedCity=c.city;selectedLocId=c.id;
const inp=_gel('ms-city-input');
inp.value=c.city;inp.classList.remove('ms-error');
_gel('ms-city-err').style.display='none';
_gel('ms-city-badge-text').textContent=c.city;
_gel('ms-city-badge').classList.add('visible');
hideDrop();
const checking=_gel('ms-city-checking');
const noCourses=_gel('ms-city-no-courses');
if(checking)checking.classList.add('visible');
if(noCourses)noCourses.style.display='none';
const age=getLiveAge();
try{
if(age){
const key=C.cacheKey.coursesLoc(c.id);
let data=_c(key);
if(!data){data=await apiFetch(C.api.coursesByLoc(c.id));_s(key,data);}
const matched=matchGroups(data.preparedCollection||[],age);
const hasAny=matched.some(g=>(g.courses||[]).some(cr=>cr.isAvailable));
if(!hasAny){
selectedCity=null;selectedLocId=null;
_gel('ms-city-badge').classList.remove('visible');
if(noCourses)noCourses.style.display='block';
}
}
}catch(e){
console.warn('[MS] pickCity check failed',e);
}finally{
if(checking)checking.classList.remove('visible');
}
refreshStep1Btn();
}
let _mapInst=null;
function selectMode(mode){
_autoSelectedCourse=false;
selectedMode=mode;selectedCity=null;selectedLocId=null;
document.querySelectorAll('.ms-mode-option').forEach(b=>b.classList.toggle('selected',b.dataset.mode===mode));
const cb=_mCb();
if(mode==='stationary'){
cb.classList.add('visible');
cb.style.opacity='';cb.style.pointerEvents='';cb.style.maxHeight='';cb.style.overflow='';
const age=getLiveAge();
if(age) loadCitiesForAge(age);
} else {
cb.classList.remove('visible');
const inp=_gel('ms-city-input');if(inp){inp.value='';inp.classList.remove('ms-error');}
const err=_gel('ms-city-err');if(err)err.style.display='none';
const badge=_gel('ms-city-badge');if(badge)badge.classList.remove('visible');
hideDrop();
}
refreshStep1Btn();
}
window.selectMode=selectMode;
function refreshStep1Btn(){
const btn=_gel('ms-hs-next');if(!btn)return;
const ok=selectedMode==='online'||(selectedMode==='stationary'&&selectedCity&&selectedLocId);
btn.disabled=!ok;btn.style.opacity=ok?'1':'0.4';btn.style.pointerEvents=ok?'auto':'none';
}
const _mLdr=()=>_gel('ms-mode-loader'),_mCb=()=>_gel('ms-city-block');
function _gtm(e,x){(window.dataLayer=window.dataLayer||[]).push(Object.assign({event:e,mf_market:C.market,mf_mode:selectedMode,mf_course:selectedCourseName,mf_city:selectedCity},x));}function _msEndLoad(b,t,l,cb,ok){if(l)l.style.display='';if(t&&t.dataset.orig)t.textContent=t.dataset.orig;if(!ok){b.style.display='none';}else{b.disabled=false;b.style.display='';b.style.opacity='';b.classList.remove('ms-mode-disabled');b.style.pointerEvents='';const _bt=b.querySelector('.ms-mode-option-text');if(_bt)_bt.style.opacity='';if(cb){cb.style.maxHeight='';cb.style.overflow='visible';}}if(cb){cb.style.opacity=ok?'':'0.3';cb.style.pointerEvents=ok?'':'none';}}
async function checkStationaryAvailability(age){
const btn=_gel('ms-mode-stationary');
if(!btn||!age)return;
const cached=_c(C.cacheKey.citiesAge(age));
if(!cached){
btn.disabled=true;btn.style.pointerEvents='none';
const txt=btn.querySelector('.ms-mode-option-text');
const orig=txt?txt.textContent:'';
if(txt){txt.dataset.orig=txt.textContent||T.modeStation;txt.innerHTML='<span class="ms-skel-line"></span>';}
const _loader=_mLdr();
if(_loader)_loader.style.display='inline-block';
const _cb=_mCb();
if(_cb){_cb.style.opacity='0';_cb.style.pointerEvents='none';_cb.style.maxHeight='0';_cb.style.overflow='hidden';}
try{
const data=await apiFetch(C.api.citiesForAge(age));
if(Array.isArray(data)&&data.length>0)_s(C.cacheKey.citiesAge(age),data);
const available=Array.isArray(data)?data:[];
btn.disabled=false;btn.style.pointerEvents='';
const _l=_mLdr();
const _cb2=_mCb();
const _ci=_gel('ms-city-input');
if(available.length===0){_msEndLoad(btn,txt,_l,_cb2,false);if(selectedMode==='stationary')selectMode('online');}
else{_msEndLoad(btn,txt,_l,null,true);allCities=available;const _sm=selectedMode==='stationary';if(_cb2){_cb2.style.opacity=_sm?'':'0.3';_cb2.style.pointerEvents=_sm?'':'none';if(_sm){_cb2.style.maxHeight='';_cb2.style.overflow='visible';}}}
if(_ci)_ci.disabled=false;
}catch(e){
_msEndLoad(btn,txt,_mLdr(),_mCb(),true);
}
}else{
const available=_c(C.cacheKey.citiesAge(age))||[];
if(available.length===0){
btn.style.display='none';
if(selectedMode==='stationary') selectMode('online');
}else{
btn.disabled=false;btn.style.opacity='';btn.style.pointerEvents='';
allCities=available;
}
}
}
function injectModeBlock(formEl){
if(C.forceOnline){selectedMode='online';return;}
const wrap=document.createElement('div');
wrap.className='ms-mode-block';
wrap.style.marginTop='0';
wrap.innerHTML=`
<div class="ms-mode-label" style="display:flex;align-items:center;gap:8px;"><strong>${T.modeLabel}</strong><span class="ms-mode-loader" id="ms-mode-loader"></span></div>
<button type="button" class="ms-mode-option" data-mode="online" onclick="selectMode('online')">
<span class="ms-mode-option-text">${T.modeOnline}</span>
<span class="ms-mode-checkbox"></span>
</button>
<button type="button" id="ms-mode-stationary" class="ms-mode-option" data-mode="stationary" onclick="selectMode('stationary')">
<span class="ms-mode-option-text">${T.modeStation}</span>
<span class="ms-mode-checkbox"></span>
</button>
<div class="ms-city-block" id="ms-city-block">
<div class="ms-list-panel active" style="display:block;">
<div class="ms-city-search-wrap">
<input type="text" id="ms-city-input" class="ms-city-input" placeholder="${T.cityPlaceholder}" autocomplete="address-level2" spellcheck="false" data-1p-ignore data-lpignore="true" data-form-type="other"/>
<div class="ms-city-dropdown" id="ms-city-dropdown"></div>
</div>
<div class="ms-city-checking" id="ms-city-checking">
<div class="ms-spinner" style="width:14px;height:14px;border-width:2px;"></div>
${T.cityChecking}
</div>
<div class="ms-city-no-courses" id="ms-city-no-courses">${T.cityNoCourses}</div>
<div class="ms-city-err" id="ms-city-err">${T.cityError}</div>
<div class="ms-city-badge" id="ms-city-badge">
<span class="ms-ic ms-ic-pin"></span>
<span id="ms-city-badge-text"></span>
</div>
</div>
</div>
`;
setTimeout(()=>{
const byField=formEl.querySelector('input[name="studentbirthyear"],input[name="studentyear"]');
if(byField){
let _ageCheckTimer=null;
byField.addEventListener('input',()=>{
clearTimeout(_ageCheckTimer);
_ageCheckTimer=setTimeout(()=>{
_autoSelectedCourse=false;
const age=getLiveAge();
if(!age)return;
if(C.forceOnline)return;
const wrap=document.querySelector('.ms-mode-block');
if(wrap&&wrap.dataset.hidden==='1'){
delete wrap.dataset.hidden;
wrap.style.maxHeight='600px';
wrap.style.opacity='1';
wrap.style.marginTop='';
wrap.style.marginBottom='';
wrap.style.overflow='visible';
const onlineBtn=document.querySelector('.ms-mode-option[data-mode="online"]');
const statBtn=_gel('ms-mode-stationary');
if(onlineBtn){onlineBtn.querySelector('.ms-mode-option-text').style.opacity='0.3';onlineBtn.disabled=true;onlineBtn.style.pointerEvents='none';}
if(statBtn){statBtn.querySelector('.ms-mode-option-text').style.opacity='0.3';statBtn.disabled=true;statBtn.style.pointerEvents='none';}
setTimeout(()=>{
if(onlineBtn&&onlineBtn.disabled){const ot=onlineBtn.querySelector('.ms-mode-option-text');if(ot){ot.textContent=T.modeOnline;ot.style.opacity='';}onlineBtn.disabled=false;onlineBtn.style.pointerEvents='';}
selectMode('online');
},350);
checkStationaryAvailability(age);
}else{
const cityBlock=_mCb();
const cityInp=_gel('ms-city-input');
const statBtn2=_gel('ms-mode-stationary');
if(statBtn2&&!statBtn2.disabled){
const txt2=statBtn2.querySelector('.ms-mode-option-text');
if(txt2){txt2.dataset.orig=txt2.textContent;txt2.style.opacity='0.3';}
statBtn2.disabled=true;statBtn2.style.pointerEvents='none';
}
if(cityBlock){cityBlock.style.opacity='0.4';cityBlock.style.pointerEvents='none';}
if(cityInp){cityInp.disabled=true;}
selectedCity=null;selectedLocId=null;
const badge=_gel('ms-city-badge');
if(badge)badge.classList.remove('visible');
refreshStep1Btn();
checkStationaryAvailability(age);
}
},600);
});
}
},500);
const byField=formEl.querySelector('[class*="hs_studentbirthyear"],[class*="hs_studentyear"]');
const byFieldset=byField?.closest('fieldset')||byField;
if(byFieldset?.nextSibling){
byFieldset.style.marginBottom='0';
byFieldset.parentNode.insertBefore(wrap,byFieldset.nextSibling);
}else if(byFieldset){
byFieldset.style.marginBottom='0';
byFieldset.parentNode.appendChild(wrap);
}else{
const nw=_gel('ms-hs-next-wrap');
if(nw)nw.parentNode.insertBefore(wrap,nw);
else formEl.parentNode.appendChild(wrap);
}
initCitySearch();
wrap.style.opacity='0';
wrap.style.maxHeight='0';
wrap.style.overflow='hidden';
wrap.style.marginTop='0';
wrap.style.marginBottom='0';
wrap.style.transition='opacity .35s ease, max-height .5s ease, margin .35s ease';
wrap.dataset.hidden='1';
}
async function enterStep2(){
selectedCourseId=null;selectedCourseIds=[];selectedCourseName=null;selectedCourseData=null;selectedAgeGroup=null;
refreshStep2Btn();
const list=_gel('ms-courses-list');
list.innerHTML=`<div class="ms-loading"><div class="ms-spinner"></div><span>${T.loading}</span></div>`;
const age=getLiveAge();
let collection=[];
try{
if(selectedMode==='online'){
let data=_c(C.cacheKey.coursesOnline);
if(!data){data=await apiFetch(C.api.coursesOnline);_s(C.cacheKey.coursesOnline,data);}
collection=data.preparedCollection||[];
}else{
const key=C.cacheKey.coursesLoc(selectedLocId);
let data=_c(key);
if(!data){data=await apiFetch(C.api.coursesByLoc(selectedLocId));_s(key,data);}
collection=data.preparedCollection||[];
}
}catch(e){list.innerHTML=`<div class="ms-empty">Błąd ładowania kursów.</div>`;return;}
const matched=age?matchGroups(collection,age):collection;
const seenId=new Set(),rawCourses=[];
matched.forEach(g=>{(g.courses||[]).forEach(c=>{if(c.isAvailable&&!seenId.has(c.id)){seenId.add(c.id);rawCourses.push({...c,_ageGroup:g.age});}});});
const nameMap=new Map();
rawCourses.forEach(c=>{
const key=stripCourseName(c.name).toLowerCase();
if(nameMap.has(key)){
nameMap.get(key)._ids.push(c.id);
}else{
nameMap.set(key,{...c,_ids:[c.id]});
}
});
const courses=[...nameMap.values()];
list.innerHTML=`<div class="ms-loading"><div class="ms-spinner"></div><span>${T.loading}</span></div>`;
const now=new Date();now.setHours(0,0,0,0);
const _cws=[];
await Promise.allSettled(courses.map(async course=>{
try{
const ids=course._ids||[course.id];
const allDates=[];
await Promise.allSettled(ids.map(async id=>{
try{
let data;
if(selectedMode==='online')data=await apiFetch(C.api.timetableOnline(id));
else data=await apiFetch(C.api.timetableStationary(id,selectedLocId));
(data.localisation?.dates||[]).forEach(d=>allDates.push(d));
}catch(e2){}
}));
const hasSlots=allDates.some(d=>{if(typeof d.availablePlacesNo!=='number'||d.availablePlacesNo<=0)return false;if(!d.startDate)return false;return parseDate(d.startDate)>=now;});
if(hasSlots)_cws.push(course);
}catch(e){}
}));
list.innerHTML='';
const courses2=_cws.length>0?_cws:courses;
if(!courses2.length){
const isStation=selectedMode==='stationary';
list.innerHTML=`<div class="ms-empty">
${T.noCourses}
${isStation?`<br><br><button type="button" onclick="msBackToOnline()" class="ms-btn-back-inline">Wypróbuj zajęcia Online</button>`:''}
</div>`;
return;
}
if(C.autoSelectCourse&&courses2.length===1&&!_autoSelectedCourse){_autoSelectedCourse=true;_selectCourse(courses2[0]);refreshStep2Btn();msGoStep(3);return;}
courses2.forEach(course=>{
const card=document.createElement('div');card.className='ms-course-card';
const img=course.icon?.startsWith('http')
?`<img class="ms-course-thumb" src="${course.icon}" alt="" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="ms-course-thumb-fb" style="display:none"><span class="ms-ic ms-ic-laptop" style="font-size:28px;color:#ccc;"></span></div>`
:`<img class="ms-course-thumb" src="https://cdn.prod.website-files.com/63174d5b8c207c07e0f7a1af/692eb87a0634ef1aa744143a_coding_brain_character-thumbs-up.avif" alt="" loading="lazy">`;
const desc=course.intro?course.intro.replace(/<[^>]+>/g,'').slice(0,100)+'…':'';
const hasDesc=desc.length>0;
card.innerHTML=`${img}<div class="ms-course-card-bottom"><div class="ms-course-info" style="${hasDesc?'':'display:flex;align-items:center;'}"><div class="ms-course-name">${stripCourseName(course.name)}</div>${hasDesc?`<div class="ms-course-desc">${desc}</div>`:''}</div><div class="ms-course-check"></div></div>`;
card.onclick=()=>{_selectCourse(course);refreshStep2Btn();msGoStep(3);};
list.appendChild(card);
});
return false;
}
function _selectCourse(course){
selectedCourseId=course.id;
selectedCourseIds=course._ids||[course.id];
selectedCourseName=stripCourseName(course.name);
selectedCourseData=course;selectedAgeGroup=course._ageGroup||'';
document.querySelectorAll('.ms-course-card').forEach(c=>{
const nm=c.querySelector('.ms-course-name')?.textContent;
c.classList.toggle('selected',nm===stripCourseName(course.name));
});
}
function refreshStep2Btn(){_gel('ms-next-2').classList.toggle('ms-btn-disabled',!selectedCourseId);}
async function loadSlots(){
selectedDateStr=null;selectedSlotId=null;selectedSlotData=null;
_captchaToken=null;
refreshConfirmBtn();
const _rw=_gel('ms-recaptcha-step3');
if(_rw)_rw.style.display='none';
_gel('ms-timeslots-wrap').style.display='none';
_gel('ms-cal-collapsed').style.display='none';
const cw=_gel('ms-calendar-wrap');
cw.style.display='block';
cw.innerHTML=`<div class="ms-loading"><div class="ms-spinner"></div><span>${T.loading}</span></div>`;
const _loadTimeout=setTimeout(()=>{
if(cw.querySelector('.ms-spinner')){
cw.innerHTML=`<div class="ms-empty" style="text-align:center;padding:28px;">
<div style="font-size:16px;margin-bottom:12px;">To trwa zbyt długo…<br>Spróbuj jeszcze raz.</div>
<button type="button" onclick="msGoStep(2)" style="display:inline-flex;align-items:center;gap:8px;padding:12px 24px;background:transparent;color:#555;border:2px solid #e5e5e5;border-radius:999px;font-family:Archivo,sans-serif;font-size:15px;font-weight:600;cursor:pointer;">
← Wróć
</button>
</div>`;
}
},6000);
try{
const ids=selectedCourseIds.length>0?selectedCourseIds:[selectedCourseId];
const allDates=[];
await Promise.all(ids.map(async id=>{
try{
let data;
if(selectedMode==='online')data=await apiFetch(C.api.timetableOnline(id));
else data=await apiFetch(C.api.timetableStationary(id,selectedLocId));
(data.localisation?.dates||[]).forEach(s=>allDates.push(s));
}catch(e2){console.warn('[MS] timetable failed for id',id,e2);}
}));
const available=allDates.filter(s=>typeof s.availablePlacesNo==='number'&&s.availablePlacesNo>0);
const _nowFilter=new Date();_nowFilter.setHours(0,0,0,0);
slotsByDate={};
available.forEach(s=>{if(!s.startDate||parseDate(s.startDate)<_nowFilter)return;const _dk=dateKey(parseDate(s.startDate));(slotsByDate[_dk]=slotsByDate[_dk]||[]).push(s);});
}catch(e){clearTimeout(_loadTimeout);cw.innerHTML=`<div class="ms-empty">Błąd ładowania terminów. <button type="button" onclick="msGoStep(2)" style="color:#e67e22;background:none;border:none;cursor:pointer;font-weight:600;text-decoration:underline;">Wróć</button></div>`;return;}
clearTimeout(_loadTimeout);
clearTimeout(_loadTimeout);
if(!Object.keys(slotsByDate).length){
const isStation=selectedMode==='stationary';
cw.innerHTML=`<div class="ms-empty">
${T.noSlots}
${isStation?`<br><br><button type="button" onclick="msBackToOnline()" class="ms-btn-back-inline">Wypróbuj zajęcia Online</button>`:''}
</div>`;
return;
}
const sorted=Object.keys(slotsByDate).map(d=>parseDate(d)).sort((a,b)=>a-b);
const now=new Date();now.setHours(0,0,0,0);
const first=sorted.find(d=>d>=now)||sorted[0];
calYear=first.getFullYear();calMonth=first.getMonth();
renderCalendar();
}
function renderCalendar(){
const cw=_gel('ms-calendar-wrap');
const avail=new Set(Object.keys(slotsByDate));
const today=new Date();today.setHours(0,0,0,0);
const firstDay=new Date(calYear,calMonth,1);
let startDow=firstDay.getDay()-1;if(startDow<0)startDow=6;
const lastDay=new Date(calYear,calMonth+1,0);
let html=`<div class="ms-cal-header">
<button type="button" class="ms-cal-nav" onclick="msCalPrev()">\uf053</button>
<div class="ms-cal-title">${T.calMonths[calMonth]}<span>${calYear}</span></div>
<button type="button" class="ms-cal-nav" onclick="msCalNext()">\uf054</button>
</div>
<div class="ms-cal-grid">
${T.calDays.map(d=>`<div class="ms-cal-dayname">${d}</div>`).join('')}`;
for(let i=0;i<startDow;i++)html+=`<div class="ms-cal-day"></div>`;
for(let day=1;day<=lastDay.getDate();day++){
const d=new Date(calYear,calMonth,day);const dStr=dateKey(d);
const isAvail=avail.has(dStr)&&d>=today;
const isSel=dStr===selectedDateStr;
const isToday=d.getTime()===today.getTime();
let cls='ms-cal-day';if(isAvail)cls+=' available';if(isSel)cls+=' selected';if(isToday)cls+=' today';
html+=`<div class="${cls}"${isAvail?` onclick="msSelectDate('${dStr}')"`:''}>${day}</div>`;
}
html+=`</div>`;
cw.innerHTML=html;
}
window.msCalPrev=()=>{calMonth--;if(calMonth<0){calMonth=11;calYear--;}renderCalendar();};
window.msCalNext=()=>{calMonth++;if(calMonth>11){calMonth=0;calYear++;}renderCalendar();};
window.msSelectDate=function(dStr){
selectedDateStr=dStr;selectedSlotId=null;selectedSlotData=null;
_captchaToken=null;
refreshConfirmBtn();
_showRecaptcha();
renderTimeSlots(dStr);
const wrap=_gel('ms-timeslots-wrap');
if(wrap)setTimeout(function(){wrap.scrollIntoView({behavior:'smooth',block:'start'});},80);
};
window.msExpandCalendar=function(){
_gel('ms-calendar-wrap').style.display='block';
_gel('ms-cal-collapsed').style.display='none';
const tw=_gel('ms-timeslots-wrap');
if(tw)tw.style.display='none';
selectedDateStr=null;selectedSlotId=null;selectedSlotData=null;
refreshConfirmBtn();
renderCalendar();
const cw=_gel('ms-calendar-wrap');
if(cw)setTimeout(function(){cw.scrollIntoView({behavior:'smooth',block:'start'});},80);
};
function renderTimeSlots(dStr){
const raw=slotsByDate[dStr]||[];
const wrap=_gel('ms-timeslots-wrap');
const list=_gel('ms-timeslots-list');
wrap.style.display='block';void wrap.offsetWidth;
_gtm('MFonLP_hour');
if(!raw.length){list.innerHTML=`<div class="ms-empty">${T.noSlotsOnDate}</div>`;_gel('ms-load-more-btn').style.display='none';return;}
const seen=new Set();
const deduped=raw.filter(s=>{if(seen.has(s.description))return false;seen.add(s.description);return true;});
list.dataset.count=deduped.length;
deduped.sort((a,b)=>{
const ta=(a.description||'').split('-')[0].replace(':','');
const tb=(b.description||'').split('-')[0].replace(':','');
return tb.localeCompare(ta);
});
slotsForDate=deduped;
slotsShown=Math.min(9,slotsForDate.length);
renderSlotBatch(list);
_gel('ms-load-more-btn').style.display=slotsForDate.length>slotsShown?'block':'none';
}
function renderSlotBatch(list){
list.innerHTML='';
slotsForDate.slice(0,slotsShown).forEach(slot=>{
const isLast=slot.availablePlacesNo>0&&slot.availablePlacesNo<=3;
const div=document.createElement('div');div.className='ms-timeslot';div.dataset.id=slot.timetableId;
div.innerHTML=`
<div class="ms-timeslot-radio"></div>
<div class="ms-timeslot-time">${slot.description||''}</div>
${isLast?`<div class="ms-timeslot-badge"><span class="ms-ic ms-ic-fire"></span> ${T.lastPlaces(slot.availablePlacesNo)}</div>`:''}`;
div.onclick=()=>selectSlot(slot.timetableId,{day:slot.title||'',time:slot.description||'',startDate:slot.startDate||''});
list.appendChild(div);
});
}
window.msLoadMore=function(){
slotsShown=Math.min(slotsShown+3,slotsForDate.length);
renderSlotBatch(_gel('ms-timeslots-list'));
_gel('ms-load-more-btn').style.display=slotsShown<slotsForDate.length?'block':'none';
};
function selectSlot(id,data){
selectedSlotId=id;selectedSlotData=data;
document.querySelectorAll('.ms-timeslot').forEach(c=>c.classList.toggle('selected',+c.dataset.id===id));
refreshConfirmBtn();
}
function refreshConfirmBtn(){_gel('ms-confirm-btn').classList.toggle('ms-btn-disabled',!(selectedSlotId&&_captchaToken));}
window.msBackToOnline=async function(){
selectedMode='online';
selectedCity=null;selectedLocId=null;
selectedCourseId=null;selectedCourseIds=[];selectedCourseName=null;selectedCourseData=null;selectedAgeGroup=null;
document.querySelectorAll('.ms-mode-option').forEach(b=>b.classList.toggle('selected',b.dataset.mode==='online'));
const cb=_mCb();if(cb)cb.classList.remove('visible');
await enterStep2();
msGoStep(2);
};
function buildConfirmationScreen(){
const card=_gel('ms-confirm-course-card');
const _noThumb=`<div class="ms-confirm-thumb-fb" style="background:#f0f0f0;">
<svg viewBox="0 0 80 64" width="80" xmlns="http://www.w3.org/2000/svg">
<rect width="80" height="64" fill="#e67e22" opacity=".12" rx="6"/>
<path d="M20 48V18a2 2 0 0 1 2-2h12c3 0 6 2 6 6s-3 6-6 6H22m18-6h4a6 6 0 0 1 0 12H40V22" stroke="#e67e22" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>
</div>`;
const img=selectedCourseData?.icon?.startsWith('http')
?`<img class="ms-confirm-thumb" src="${selectedCourseData.icon}" alt="" onerror="this.outerHTML=_noThumb">`
:_noThumb;
const desc=selectedCourseData?.intro?(selectedCourseData.intro.replace(/<[^>]+>/g,'').slice(0,120)+'…'):'';
card.innerHTML=`${img}<div class="ms-confirm-course-info"><div class="ms-confirm-course-name">${selectedCourseName||''}</div><div class="ms-confirm-course-desc">${desc}</div></div>`;
const _stu=(savedFormData.student_name||'')+(savedFormData.student_surname?' '+savedFormData.student_surname:'');
_gel('ms-confirm-details').innerHTML=[
_stu?{ic:'ms-ic-users',l:T.labelStudentName||'Uczestnik:',v:_stu}:null,
{ic:'ms-ic-users', l:T.labelAgeGroup, v:selectedAgeGroup||''},
{ic:'ms-ic-phone', l:T.labelPhone, v:savedFormData.phone||''},
{ic:'ms-ic-cal-alt',l:T.labelDate, v:selectedSlotData?(selectedSlotData.day+' '+selectedSlotData.startDate):''},
{ic:'ms-ic-clock', l:T.labelTime, v:selectedSlotData?.time||''},
].filter(Boolean).map(r=>`<div class="ms-confirm-row"><span class="ms-confirm-row-icon"><span class="ms-ic ${r.ic}"></span></span><span class="ms-confirm-row-label">${r.l}</span><span class="ms-confirm-row-value">${r.v}</span></div>`).join('');
buildCalendarButtons();
}
function buildCalendarButtons(){
if(!selectedSlotData?.startDate||!selectedSlotData?.time)return;
const tr=selectedSlotData.time.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
if(!tr)return;
const s=isoToICS(selectedSlotData.startDate,tr[1]);
const e=isoToICS(selectedSlotData.startDate,tr[2]);
const title=encodeURIComponent(`Giganci Programowania — ${selectedCourseName||'Lekcja próbna'}`);
const desc=encodeURIComponent(`Kurs: ${selectedCourseName||''}\nGrupa: ${selectedAgeGroup||''}`);
const ics=URL.createObjectURL(new Blob([`BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${decodeURIComponent(title)}\nDTSTART:${s}\nDTEND:${e}\nDESCRIPTION:${decodeURIComponent(desc)}\nEND:VEVENT\nEND:VCALENDAR`],{type:'text/calendar'}));
const gcUrl=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${s}/${e}&details=${desc}`;
const outUrl=`https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${selectedSlotData.startDateDateTimeFormat?selectedSlotData.startDateDateTimeFormat.split('T')[0]:selectedSlotData.startDate.split('/').reverse().join('-')}T${tr[1]}&body=${desc}`;
_loadFABrands();
_gel('ms-cal-buttons').innerHTML=[
{ic:'fas fa-calendar-alt', color:'#e26200', bg:'#fff3eb', label:T.calSystem, href:ics, dl:'giganci-lekcja.ics'},
{ic:'fab fa-google', color:'#4285f4', bg:'#e8f0fe', label:T.calGoogle, href:gcUrl, target:'_blank'},
{ic:'fab fa-windows', color:'#0078d4', bg:'#e3f2fd', label:T.calOutlook, href:outUrl,target:'_blank'},
{ic:'fab fa-apple', color:'#1c1c1e', bg:'#f2f2f2', label:T.calApple, href:ics, dl:'giganci-lekcja.ics'},
].map(b=>`<a href="${b.href}" ${b.dl?`download="${b.dl}"`:`target="${b.target}" rel="noopener"`} class="ms-cal-btn">
<span style="width:32px;height:32px;border-radius:8px;background:${b.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
<i class="${b.ic}" style="color:${b.color};font-size:17px;"></i>
</span>
${b.label}
<span style="margin-left:auto;color:#ccc;font-family:'Fa Solid 900',sans-serif;font-size:11px;">&#xf35d;</span>
</a>`).join('');
}
function _loadRecaptchaScript(){
return new Promise(resolve=>{
if(window.grecaptcha){resolve();return;}
window._msRecaptchaReady=resolve;
if(!_gel('ms-recaptcha-script')){
const s=document.createElement('script');
s.id='ms-recaptcha-script';
s.src='https://www.google.com/recaptcha/api.js?onload=_msRecaptchaReady&render=explicit';
s.async=true;s.defer=true;
document.head.appendChild(s);
}
});
}
let _recaptchaWidgetId=null;
async function _showRecaptcha(){
const wrap=_gel('ms-recaptcha-step3');
if(!wrap)return;
wrap.style.display='block';
await _loadRecaptchaScript();
if(_recaptchaWidgetId!==null){grecaptcha.reset(_recaptchaWidgetId);_captchaToken=null;refreshConfirmBtn();return;}
const isMobile=window.innerWidth<=480;
_recaptchaWidgetId=grecaptcha.render(wrap,{
sitekey:C.recaptchaSiteKey,
theme:'light',
size: isMobile ? 'compact' : 'normal',
callback:function(token){_captchaToken=token;refreshConfirmBtn();},
'expired-callback':function(){_captchaToken=null;refreshConfirmBtn();},
'error-callback':function(){_captchaToken=null;refreshConfirmBtn();},
});
}
function _resetRecaptcha(){
if(_recaptchaWidgetId!==null&&window.grecaptcha){
try{grecaptcha.reset(_recaptchaWidgetId);}catch(e){}
}
_captchaToken=null;
const w=_gel('ms-recaptcha-step3');
if(w)w.style.display='none';
}
async function callRegistration(captchaToken,signal){
if(!C.registrationApiUrl)return{ok:false,err:'No registration URL'};
const year=+(savedFormData.studentbirthyear||0);
const body={
timetableId:selectedSlotId,
personalData:{
studentName:savedFormData.student_name||'',
studentSurname:savedFormData.student_surname||'',
birthYear:year||null,
parentName:savedFormData.firstname||'',
parentSurname:'',
phoneNumber:savedFormData.phone||'',
addPhoneNumber:'',
email:savedFormData.email||'',
addEmail:'',
},
channelNotes:'',
registrationNotes:'Webflow form',
statuteAgreed:!!savedFormData.statuteagreed,
advertisementAgreed:!!savedFormData.advertisementagreed,
otherAdvertisementAgreed:false,
captchaResponse:captchaToken,
isSelfRegistered:true,
postalCode:'00000',
schoolId:null,
discountBundle:{discountWithCode:false,discountCode:'',codeType:null,ruleId:0,walletDiscount:false,walletAccessCode:''},
marketingData:null,
};
try{
const r=await fetch(C.registrationApiUrl,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(body),signal:signal});
const data=await r.json().catch(()=>({}));
return{ok:r.ok,status:r.status,data};
}catch(e){
return{ok:false,err:String(e)};
}
}
window.msConfirm=async function(){
if(!selectedSlotId||!$hsForm)return;
if(!_captchaToken){
const w=_gel('ms-recaptcha-step3');
if(w){w.style.outline='2px solid #e00';w.style.borderRadius='8px';setTimeout(()=>{if(w)w.style.outline='';},2500);}
w?.scrollIntoView({behavior:'smooth',block:'center'});
return;
}
const btn=_gel('ms-confirm-btn');
const origHtml=btn.innerHTML;
btn.disabled=true;
btn.innerHTML='<div class="ms-spinner" style="width:18px;height:18px;border-width:2px;"></div>';
const errBanner=_gel('ms-reg-error');
if(errBanner)errBanner.style.display='none';
const extras={ms_class_mode:selectedMode||'',ms_student_name:savedFormData.student_name||'',ms_student_surname:savedFormData.student_surname||'',ms_city:selectedCity||'',ms_localisation_id:String(selectedLocId||''),ms_course_id:String(selectedCourseId||''),ms_course_name:selectedCourseName||'',ms_age_group:selectedAgeGroup||'',ms_timetable_id:String(selectedSlotId||''),ms_slot_day:selectedSlotData?.day||'',ms_slot_time:selectedSlotData?.time||'',ms_slot_start_date:selectedSlotData?.startDate||''};
Object.entries(extras).forEach(([k,v])=>{let inp=$hsForm.find('input[name="'+k+'"]');if(!inp.length){inp=$('<input type="hidden" name="'+k+'">');$hsForm.append(inp);}inp.val(v);});
_hsSubmitOk=false;
$hsForm.off('submit');
$hsForm.find('input[type="submit"],button[type="submit"]').trigger('click');
const _hsTracker=(async function(){var ok=await _waitForHsSuccess(3000);if(ok){_gtm('MFonLP_hs_embed');return;}var ok2=await _directHsSubmit(extras);if(ok2)_gtm('MFonLP_hs_direct');else _gtm('MFonLP_hs_failed');})();
const ctrl=new AbortController();
const tmOut=setTimeout(function(){ctrl.abort();},20000);
let regResult;
try{regResult=await callRegistration(_captchaToken,ctrl.signal);clearTimeout(tmOut);}
catch(e){clearTimeout(tmOut);regResult={ok:false,err:e.name==='AbortError'?(T.errTimeout||'Połączenie wygasło. Spróbuj ponownie.'):String(e)};}
const rd=regResult.data||{};
const regMsg=rd.message?rd.message.split('\r').join('').split('\n').join(' ').trim():'';
if(!regResult.ok||rd.isSuccessful===false){
_resetRecaptcha();
refreshConfirmBtn();
btn.disabled=false;btn.innerHTML=origHtml;
const eb=_gel('ms-reg-error');
if(eb){eb.textContent=regMsg||regResult.err||T.errRegistration||'Błąd rejestracji. Spróbuj ponownie.';eb.style.display='block';eb.scrollIntoView({behavior:'smooth',block:'center'});}
return;
}
await _hsTracker;
btn.disabled=false;btn.innerHTML=origHtml;
msGoStep(4);
};
async function validatePhoneApi(phone){try{const r=await fetch(C.phoneUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,country:C.country})});if(!r.ok)return{isValid:true};return r.json();}catch(e){return{isValid:true};}}
function _msUpdateLabel(el){
if(!el)return;
const field=el.closest('.hs-form-field');
if(!field)return;
field.classList.toggle('ms-has-value',!!(el.value&&el.value.length>0));
}
function _msPollLabels(){
document.querySelectorAll('#hubspot-form-wrapper .hs-input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=submit])').forEach(function(el){_msUpdateLabel(el);});
}
function initHS(){
if(typeof hbspt==='undefined'){setTimeout(initHS,300);return;}
hbspt.forms.create({
portalId:C.portalId,formId:C.formId,region:'na1',
target:'#hubspot-form-wrapper',
onFormReady:function($form){try{
_gtm('MFonLP_start');
$hsForm=$form;
const _skel=_gel('ms-form-skel');if(_skel)_skel.remove();
const p=T.phonePrefix,rx=T.phoneRe;
const fPhone=$form.find("input[name='phone']");
const fName=$form.find("input[name='firstname']");
const fYear=$form.find("input[name='studentbirthyear'],input[name='studentyear']").first();
if(fYear.length){
fYear.attr('maxlength','4').attr('inputmode','numeric');
fYear.on('keydown',function(ev){if(ev.ctrlKey||ev.metaKey||['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'].includes(ev.key))return;if(!/^\d$/.test(ev.key)){ev.preventDefault();return;}if(this.value.length>=4&&(this.selectionEnd-this.selectionStart)===0)ev.preventDefault();});
fYear.on('input paste',function(){this.value=this.value.replace(/\D/g,'').slice(0,4);_msUpdateLabel(this);});
fYear.on('blur',function(){_msUpdateLabel(this);});
_msUpdateLabel(fYear[0]);
const yearErrEl=$('<ul class="no-list hs-error-msgs inputs-list" style="display:none;"><li><label class="hs-error-msg hs-main-font-element">Wiek dziecka musi wynosić od 7 do 18 lat.</label></li></ul>');
fYear.closest('.hs-form-field').append(yearErrEl);
fYear.on('blur input',function(){
const yr=+this.value;
if(this.value.length<4){yearErrEl.hide();return;}
const age=new Date().getFullYear()-yr;
const ok=age>=7&&age<=18;
yearErrEl.toggle(!ok);
fYear.toggleClass('error',!ok);
ok?fYear.removeAttr('aria-invalid'):fYear.attr('aria-invalid','true');
});
}
const fnErr=$(`<ul class="no-list hs-error-msgs inputs-list" style="display:none;"><li><label class="hs-error-msg hs-main-font-element">${T.fnMin}</label></li></ul>`);
if(fName.length){
fName.closest('.hs-form-field').append(fnErr);let ft=false;
const vN=(f=false)=>{if(!ft&&!f)return true;const ok=fName.val().trim().length>=3;fnErr.toggle(!ok);fName.toggleClass('error',!ok);ok?fName.removeAttr('aria-invalid'):fName.attr('aria-invalid','true');return ok;};
fName.on('input paste keyup',()=>{ft=true;vN();});fName.on('blur',()=>{ft=true;vN();});
}
const fStudentName=$form.find("input[name='"+C.fieldStudentName+"']");
const fLastname=$form.find("input[name='"+C.fieldStudentSurname+"']");
const _nameRe=/^[^\d\s!@#$%^&*()+={}\[\]|\\<>?\/~`;:,."]+$/;
function _vNF(fld,err,errInv){const v=fld.val().trim();if(v.length<2){err.show();errInv.hide();fld.attr('aria-invalid','true').addClass('error');return false;}if(!_nameRe.test(v)){err.hide();errInv.show();fld.attr('aria-invalid','true').addClass('error');return false;}err.hide();errInv.hide();fld.removeAttr('aria-invalid').removeClass('error');return true;}
function _mkNF(fld,minMsg,invMsg){if(!fld.length)return;const err=$('<ul class="no-list hs-error-msgs inputs-list" style="display:none;"><li><label class="hs-error-msg hs-main-font-element">'+minMsg+'</label></li></ul>');const errInv=$('<ul class="no-list hs-error-msgs inputs-list" style="display:none;"><li><label class="hs-error-msg hs-main-font-element">'+invMsg+'</label></li></ul>');fld.closest('.hs-form-field').append(err).append(errInv);let t=false;fld.on('input paste keyup',function(){t=true;_vNF(fld,err,errInv);});fld.on('blur',function(){t=true;_vNF(fld,err,errInv);});fld._touched=function(){return t;};fld._valid=function(){return _vNF(fld,err,errInv);};}
_mkNF(fStudentName,T.studentNameMin||'Imię dziecka musi mieć min. 2 znaki.',T.studentNameInvalid||'Imię nie może zawierać cyfr ani znaków specjalnych.');
_mkNF(fLastname,T.lastnameMin||'Nazwisko musi mieć min. 2 znaki.',T.lastnameInvalid||'Nazwisko nie może zawierać cyfr ani znaków specjalnych.');
if(!fPhone.length)return;
fPhone.attr('pattern',null);
fPhone.one('focus',function(){if(!fPhone.val()||!fPhone.val().startsWith(p))fPhone.val(p);_msUpdateLabel(fPhone[0]);});
fPhone.on('input',function(){_msUpdateLabel(this);});
const fmtE=$(`<ul class="no-list hs-error-msgs inputs-list" style="display:none;"><li><label class="hs-error-msg hs-main-font-element">${T.phoneMsg}</label></li></ul>`);
const apiE=$(`<ul class="no-list hs-error-msgs inputs-list" style="display:none;"><li><label class="hs-error-msg hs-main-font-element">${T.phoneApi}</label></li></ul>`);
fPhone.closest('.hs-form-field').append(fmtE).append(apiE);
let pt=false;
const vP=(f=false)=>{const v=fPhone.val().trim();if(!pt&&!f)return true;if(!rx.test(v)){fmtE.show();apiE.hide();fPhone.attr('aria-invalid','true').addClass('error');return false;}fmtE.hide();apiE.hide();fPhone.removeAttr('aria-invalid').removeClass('error');return true;};
fPhone.on('keydown',function(ev){const pos=this.selectionStart;if(ev.ctrlKey&&ev.key.toLowerCase()==='a'){ev.preventDefault();this.setSelectionRange(p.length,this.value.length);return;}if((ev.key==='Backspace'&&pos<=p.length)||(ev.key==='Delete'&&pos<p.length)){ev.preventDefault();return;}if(pos<p.length&&ev.key.length===1){ev.preventDefault();return;}});
fPhone.on('input paste keyup',function(){pt=true;if(!this.value.startsWith(p))this.value=p+this.value.replace(/^\+\d+/,'');vP();});
fPhone.on('focus',function(){pt=true;if(this.selectionStart<p.length)this.setSelectionRange(p.length,this.value.length);});
fPhone.on('mouseup',function(){const i=this;setTimeout(()=>{if(i.selectionStart<p.length)i.setSelectionRange(p.length,i.selectionEnd);},0);});
fPhone.on('blur',()=>{pt=true;vP();});
$form.find('.hs_submit').hide();
const nw=document.createElement('div');nw.id='ms-hs-next-wrap';nw.className='ms-nav';nw.style.marginTop='20px';
nw.innerHTML=`<button type="button" id="ms-hs-next" class="ms-btn-primary" style="opacity:.4;pointer-events:none;" disabled><span>${T.nextStep}</span><span class="ms-ic ms-ic-arrow-r"></span></button>`;
$form[0].parentNode.appendChild(nw);
injectModeBlock($form[0]);
if(C.forceOnline)refreshStep1Btn();
setTimeout(()=>{const age=getLiveAge();if(age)checkStationaryAvailability(age);},800);
_msPollLabels();setTimeout(_msPollLabels,300);setTimeout(_msPollLabels,800);
$form.find(".hs-input").on("input change blur",function(){_msUpdateLabel(this);});
nw.querySelector('#ms-hs-next').addEventListener('click',async function(){
if(!selectedMode)return;
if(selectedMode==='stationary'&&(!selectedCity||!selectedLocId)){const inp=_gel('ms-city-input');if(inp)inp.classList.add('ms-error');const err=_gel('ms-city-err');if(err)err.style.display='block';return;}
const nameOk=fName.length?fName.val().trim().length>=3:true;
if(!nameOk){fnErr.show();fName.attr('aria-invalid','true').addClass('error');return;}
if(fStudentName.length&&!fStudentName._valid()){return;}
if(fLastname.length&&!fLastname._valid()){return;}
const reqBoxes=$form.find('input[type="checkbox"][required],input[type="checkbox"].hs-input').filter(function(){
return $(this).closest('.hs-form-field').find('.hs-form-required').length>0;
});
let cbOk=true;
reqBoxes.each(function(){if(!$(this).is(':checked')){$(this).closest('.hs-form-field').addClass('hs-cb-required-error');cbOk=false;}else{$(this).closest('.hs-form-field').removeClass('hs-cb-required-error');}});
if(!cbOk)return;
pt=true;if(!vP(true))return;
if($form.find('.hs-error-msg:visible').length>0)return;
const btn=this;btn.disabled=true;btn.innerHTML='<div class="ms-spinner" style="width:18px;height:18px;border-width:2px;"></div>';
const result=await validatePhoneApi(fPhone.val().trim());
if(!result.isValid){apiE.show();fPhone.attr('aria-invalid','true').addClass('error');btn.disabled=false;btn.innerHTML=`<span>${T.nextStep}</span><span class="ms-ic ms-ic-arrow-r"></span>`;refreshStep1Btn();return;}
apiE.hide();
savedFormData={firstname:fName.val(),student_name:fStudentName.length?fStudentName.val().trim():'',student_surname:fLastname.length?fLastname.val().trim():'',email:$form.find('input[name="email"]').val(),phone:fPhone.val(),studentbirthyear:fYear.val(),advertisementagreed:$form.find('input[name="advertisementagreed"]').is(':checked'),statuteagreed:$form.find('input[name="statuteagreed"]').is(':checked')};
btn.disabled=true;btn.innerHTML='<div class="ms-spinner" style="width:18px;height:18px;border-width:2px;"></div>';
const _skipped=await enterStep2();
btn.disabled=false;btn.innerHTML=`<span>${T.nextStep}</span><span class="ms-ic ms-ic-arrow-r"></span>`;
if(!_skipped)msGoStep(2);
});
}catch(err){
console.warn('[MS] init error, fallback mode',err);
var mc=_gel('ms-container');
if(mc)mc.style.display='none';
var hs=_gel('hubspot-form-wrapper');
if(hs){hs.style.display='block';hs.style.opacity='1';}
const _skel2=_gel('ms-form-skel');if(_skel2)_skel2.remove();
var sub=document.querySelector('#hubspot-form-wrapper .hs_submit');
if(sub)sub.style.removeProperty('display');
}
},
onFormSubmit:function(){},
onFormSubmitted:function(){_hsSubmitOk=true;},
});
}
function init(){
applyI18n();
if(C.forceOnline)selectedMode='online';
else prefetchCities();
initHS();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();
