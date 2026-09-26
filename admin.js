import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, orderBy, updateDoc, doc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const demoKey="orderly_demo_orders";
const config=window.ORDERLY_FIREBASE_CONFIG||{};
const hasFirebaseConfig=!!(config.apiKey&&!String(config.apiKey).includes("REPLACE_ME"));
let db=null,firebaseLive=false,orders=[],activeFilter="all";

function setConnection(t,live=false){document.getElementById("connectionState").textContent=t;firebaseLive=live;}
function getDemoOrders(){return JSON.parse(localStorage.getItem(demoKey)||"[]");}
function saveDemoOrders(v){localStorage.setItem(demoKey,JSON.stringify(v));}
function demoSubscription(){orders=getDemoOrders();setConnection("Demo mode");render();}
function seedDemo(){const now=Date.now();saveDemoOrders([
{id:"demo-1001",orderNo:1001,table:"T1",guest:"Rahul",status:"new",items:[{name:"Masala Dosa",qty:2,price:120},{name:"Cold Coffee",qty:1,price:80}],total:320,createdAtMs:now-240000},
{id:"demo-1002",orderNo:1002,table:"T4",guest:"Priya",status:"preparing",items:[{name:"Paneer Butter Masala",qty:1,price:210},{name:"Cold Coffee",qty:2,price:80}],total:370,createdAtMs:now-660000},
{id:"demo-1003",orderNo:1003,table:"T2",guest:"Aman",status:"ready",items:[{name:"Margherita Pizza",qty:1,price:250}],total:250,createdAtMs:now-1080000}
]);demoSubscription();}
function clearDemo(){localStorage.removeItem(demoKey);demoSubscription();}
async function updateStatus(id,status){
 if(firebaseLive) await updateDoc(doc(db,"orders",id),{status});
 else {saveDemoOrders(getDemoOrders().map(o=>o.id===id?{...o,status}:o));demoSubscription();}
}
function dateFrom(o){return o.createdAt?.toDate?o.createdAt.toDate():new Date(o.createdAtMs||Date.now());}
function statusLabel(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function currency(n){return "₹"+Number(n||0).toLocaleString("en-IN");}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function nextButtons(o){
 const b=[];
 if(o.status==="new")b.push('<button class="btn primary" data-status="preparing" data-id="'+o.id+'">Start preparing</button>');
 if(o.status==="preparing")b.push('<button class="btn primary" data-status="ready" data-id="'+o.id+'">Mark ready</button>');
 if(o.status==="ready")b.push('<button class="btn primary" data-status="completed" data-id="'+o.id+'">Complete</button>');
 if(!["completed","cancelled"].includes(o.status))b.push('<button class="btn ghost" data-status="cancelled" data-id="'+o.id+'">Cancel</button>');
 return b.join("");
}
function render(){
 const visible=orders.filter(o=>activeFilter==="all"||o.status===activeFilter).sort((a,b)=>dateFrom(b)-dateFrom(a));
 const el=document.getElementById("orders");
 el.innerHTML=visible.length?visible.map(o=>'<article class="order-card"><div class="order-top"><div><strong>#'+(o.orderNo||String(o.id).slice(0,6))+'</strong><div class="order-id">'+dateFrom(o).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})+'</div></div><span class="pill '+o.status+'">'+statusLabel(o.status)+'</span></div><div style="margin-top:8px"><strong>Table '+escapeHtml(o.table||"—")+'</strong> · '+escapeHtml(o.guest||"Guest")+'</div><div class="order-items">'+(o.items||[]).map(i=>'<div class="order-item-line"><span>'+escapeHtml(i.name)+' × '+i.qty+'</span><strong>'+currency(i.price*i.qty)+'</strong></div>').join("")+'</div><div style="display:flex;justify-content:space-between;font-weight:800"><span>Total</span><span>'+currency(o.total)+'</span></div><div class="order-actions">'+nextButtons(o)+'</div></article>').join(""):'<div class="empty">No orders in this view.</div>';
 document.getElementById("statNew").textContent=orders.filter(o=>o.status==="new").length;
 document.getElementById("statPreparing").textContent=orders.filter(o=>o.status==="preparing").length;
 document.getElementById("statReady").textContent=orders.filter(o=>o.status==="ready").length;
 document.getElementById("statRevenue").textContent=currency(orders.filter(o=>o.status!=="cancelled").reduce((s,o)=>s+Number(o.total||0),0));
 el.querySelectorAll("[data-status]").forEach(btn=>btn.addEventListener("click",()=>updateStatus(btn.dataset.id,btn.dataset.status)));
}
document.getElementById("filters").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;activeFilter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));render();});
document.getElementById("seedDemo").addEventListener("click",seedDemo);
document.getElementById("clearDemo").addEventListener("click",clearDemo);

if(hasFirebaseConfig){
 const app=initializeApp(config);db=getFirestore(app);setConnection("Firebase live",true);
 const q=query(collection(db,"orders"),orderBy("createdAt","desc"));
 onSnapshot(q,s=>{orders=s.docs.map(d=>({id:d.id,...d.data()}));render();},err=>{console.error(err);setConnection("Firebase unavailable");demoSubscription();});
}else demoSubscription();