(() => {
  "use strict";
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const KEY = "jdx-pocket-data-v1";
  const themes = [
    {name:"cyan", accent:"#00d9ff", rgb:"0,217,255"},
    {name:"violet", accent:"#a78bfa", rgb:"167,139,250"},
    {name:"lime", accent:"#b7f56a", rgb:"183,245,106"},
    {name:"pink", accent:"#ff7eb6", rgb:"255,126,182"}
  ];
  let themeIndex = 0, filterMode = "all", toastTimeout, timerInterval = null, selectedMinutes = 25, remaining = 25*60, running = false;
  let data = {tasks:[], notes:[]};
  try { const parsed = JSON.parse(localStorage.getItem(KEY) || "null"); if(parsed && Array.isArray(parsed.tasks) && Array.isArray(parsed.notes)) data = parsed; } catch (_) {}
  const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) { showToast("Не удалось сохранить данные на устройстве"); } render(); };
  const showToast = msg => { const el=$("#toast"); el.textContent=msg; el.classList.add("show"); clearTimeout(toastTimeout); toastTimeout=setTimeout(()=>el.classList.remove("show"),2300); };
  const dateLabel = () => new Intl.DateTimeFormat("ru-RU",{weekday:"long",day:"numeric",month:"long"}).format(new Date()).toUpperCase();
  function updateClock(){ $("#today").textContent=dateLabel(); $("#clock").textContent=new Intl.DateTimeFormat("ru-RU",{hour:"2-digit",minute:"2-digit"}).format(new Date()); const h=new Date().getHours(); $("#greeting").innerHTML=(h<5?"Не спится, исследователь":h<12?"Доброе утро, исследователь":h<18?"Привет, исследователь":"Добрый вечер, исследователь")+'<span>.</span>'; }
  function empty(title, body){return `<div class="empty-state"><strong>${title}</strong>${body}</div>`;}
  function taskHTML(task){return `<div class="task-item ${task.done?"done":""}" data-id="${escapeHTML(task.id)}"><button class="check-btn" data-action="toggle" aria-label="${task.done?"Отметить активной":"Отметить готовой"}">${task.done?"✓":""}</button><div class="task-text">${escapeHTML(task.text)}</div><span class="task-time">${task.done?"ГОТОВО":"АКТИВНАЯ"}</span><button class="delete-btn" data-action="delete" aria-label="Удалить задачу">×</button></div>`;}
  function noteHTML(note){return `<article class="note-card" data-id="${escapeHTML(note.id)}"><h3>${escapeHTML(note.title)}</h3><p>${escapeHTML(note.body)}</p><div class="note-meta"><span>${escapeHTML(note.date)}</span><button class="delete-btn" data-action="delete-note" aria-label="Удалить заметку">Удалить ×</button></div></article>`;}
  function render(){
    const total=data.tasks.length, done=data.tasks.filter(t=>t.done).length;
    $("#doneCount").textContent=done; $("#taskRatio").textContent="/ "+total; $("#noteCount").textContent=data.notes.length;
    $("#progressBar").style.width=(total?done/total*100:0)+"%";
    const open=data.tasks.filter(t=>!t.done), recentNotes=[...data.notes].reverse();
    $("#homeTasks").innerHTML=open.length?open.slice(0,3).map(taskHTML).join(""):empty("Всё под контролем","Добавь задачу — и сделай первый шаг.");
    $("#homeNotes").innerHTML=recentNotes.length?recentNotes.slice(0,2).map(noteHTML).join(""):empty("Здесь пока тихо","Сохрани первую идею, чтобы не потерять её.");
    const filtered=data.tasks.filter(t=>filterMode==="all"||(filterMode==="open"&&!t.done)||(filterMode==="done"&&t.done));
    $("#tasksList").innerHTML=filtered.length?filtered.map(taskHTML).join(""):empty(filterMode==="done"?"Пока ничего не завершено":filterMode==="open"?"Активных задач нет":"Список пока пуст","Это хороший момент, чтобы добавить что-нибудь важное.");
    $("#notesList").innerHTML=recentNotes.length?recentNotes.map(noteHTML).join(""):empty("Заметок пока нет","Запиши первую мысль в форме выше.");
  }
  function switchTab(name){
    $$(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));
    $$(".view").forEach(v=>v.classList.toggle("active",v.id===name+"View"));
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function addTask(text){text=text.trim();if(!text)return;data.tasks.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),text,done:false,created:Date.now()});save();showToast("Задача добавлена ✓");}
  $$(".tab").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));
  $$("[data-goto]").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.goto)));
  $("#taskForm").addEventListener("submit",e=>{e.preventDefault();addTask($("#taskInput").value);$("#taskInput").value="";});
  $("#quickTaskBtn").addEventListener("click",()=>{$("#taskModal").classList.remove("hidden");setTimeout(()=>$("#modalTaskInput").focus(),80);});
  $("#modalClose").addEventListener("click",()=>$("#taskModal").classList.add("hidden"));
  $("#taskModal").addEventListener("click",e=>{if(e.target.id==="taskModal")$("#taskModal").classList.add("hidden");});
  $("#modalTaskForm").addEventListener("submit",e=>{e.preventDefault();addTask($("#modalTaskInput").value);$("#modalTaskInput").value="";$("#taskModal").classList.add("hidden");});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")$("#taskModal").classList.add("hidden");});
  $("#noteForm").addEventListener("submit",e=>{e.preventDefault();const title=$("#noteTitle").value.trim(),body=$("#noteBody").value.trim();if(!title||!body)return;data.notes.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),title,body,date:new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"short",year:"numeric"}).format(new Date())});save();$("#noteTitle").value="";$("#noteBody").value="";showToast("Заметка сохранена ✓");});
  $$(".filter").forEach(b=>b.addEventListener("click",()=>{filterMode=b.dataset.filter;$$(".filter").forEach(x=>x.classList.toggle("active",x===b));render();}));
  $("#clearDone").addEventListener("click",()=>{const n=data.tasks.filter(t=>t.done).length;if(!n){showToast("Готовых задач пока нет");return;}if(confirm(`Удалить готовые задачи (${n})?`)){data.tasks=data.tasks.filter(t=>!t.done);save();showToast("Готовые задачи удалены");}});
  document.addEventListener("click",e=>{const btn=e.target.closest("[data-action]");if(!btn)return;const card=btn.closest("[data-id]");if(!card)return;const id=card.dataset.id, action=btn.dataset.action;if(action==="toggle"){const t=data.tasks.find(x=>x.id===id);if(t)t.done=!t.done;save();}else if(action==="delete"){data.tasks=data.tasks.filter(x=>x.id!==id);save();showToast("Задача удалена");}else if(action==="delete-note"){if(confirm("Удалить эту заметку?")){data.notes=data.notes.filter(x=>x.id!==id);save();showToast("Заметка удалена");}}});
  $("#themeBtn").addEventListener("click",()=>{themeIndex=(themeIndex+1)%themes.length;const t=themes[themeIndex];document.documentElement.style.setProperty("--accent",t.accent);document.documentElement.style.setProperty("--accent-rgb",t.rgb);showToast("Акцент: "+({cyan:"неон",violet:"фиолетовый",lime:"лайм",pink:"розовый"}[t.name]));});
  $("#exportBtn").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({app:"JDX Pocket",exportedAt:new Date().toISOString(),...data},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="jdx-pocket-backup.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast("Резервная копия подготовлена");});
  function updateTimer(){const m=String(Math.floor(remaining/60)).padStart(2,"0"),s=String(remaining%60).padStart(2,"0");$("#timer").textContent=`${m}:${s}`;document.title=running?`${m}:${s} · JDX Pocket`:"JDX Pocket";}
  function stopTimer(){if(timerInterval)clearInterval(timerInterval);timerInterval=null;running=false;$("#timerStart").textContent="Продолжить фокус";}
  function startTimer(){if(running){stopTimer();$("#timerCaption").textContent="Пауза. Можешь передохнуть.";return;}if(remaining<=0)remaining=selectedMinutes*60;running=true;$("#timerStart").textContent="Пауза";$("#timerCaption").textContent="Ты справишься. Просто продолжай.";timerInterval=setInterval(()=>{remaining--;updateTimer();if(remaining<=0){stopTimer();$("#timerCaption").textContent="Сессия завершена — отличная работа!";$("#timerStart").textContent="Начать снова";showToast("Фокус-сессия завершена! Сделай небольшой перерыв ✨");if("vibrate" in navigator)navigator.vibrate([150,80,150]);}},1000);}
  $("#timerStart").addEventListener("click",startTimer);
  $("#timerReset").addEventListener("click",()=>{stopTimer();remaining=selectedMinutes*60;updateTimer();$("#timerStart").textContent="Начать фокус";$("#timerCaption").textContent="Время выбрать одну цель.";});
  $$(".preset").forEach(b=>b.addEventListener("click",()=>{stopTimer();selectedMinutes=Number(b.dataset.minutes);remaining=selectedMinutes*60;$$(".preset").forEach(x=>x.classList.toggle("active",x===b));$("#timerStart").textContent="Начать фокус";$("#timerCaption").textContent="Время выбрать одну цель.";updateTimer();}));
  if("serviceWorker" in navigator && location.protocol.startsWith("http"))window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  updateClock();setInterval(updateClock,15000);updateTimer();render();
})();