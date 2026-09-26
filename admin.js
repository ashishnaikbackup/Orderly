// Orderly restaurant dashboard — Supabase Realtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cfg=window.ORDERLY_SUPABASE_CONFIG||{};
const ready=cfg.url&&cfg.anonKey&&!String(cfg.url).includes("REPLACE_ME");
const supabase=ready?createClient(cfg.url,cfg.anonKey):null;
const RESTAURANT_SLUG="orderly-demo";
let restaurantId=null,orders=[],activeFilter="all";

const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const currency=n=>"₹"+Number(n||0).toLocaleString("en-IN");

function setConnection(t){$("connectionState").textContent=t;}
function dateFrom(o){return o.created_at?new Date(o.created_at):new Date();}
function statusLabel(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function nextButtons(o){
 const b=[];
 if(o.status==="new")b.push('<button class="btn primary" data-id="'+o.id+'" data-status="preparing">Start preparing</button>');
 if(o.status==="preparing")b.push('<button class="btn primary" data-id="'+o.id+'" data-status="ready">Mark ready</button>');
 if(o.status==="ready")b.push('<button class="btn primary" data-id="'+o.id+'" data-status="completed">Complete</button>');
 if(!["completed","cancelled"].includes(o.status))b.push('<button class="btn ghost" data-id="'+o.id+'" data-status="cancelled">Cancel</button>');
 return b.join("");
}
function render(){
 const visible=orders.filter(o=>activeFilter==="all"||o.status===activeFilter).sort((a,b)=>dateFrom(b)-dateFrom(a));
 $("orders").innerHTML=visible.length?visible.map(o=>'<article class="order-card"><div class="order-top"><div><strong>#'+String(o.id).slice(-6).toUpperCase()+'</strong><div class="order-id">'+dateFrom(o).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})+'</div></div><span class="pill '+esc(o.status)+'">'+statusLabel(o.status)+'</span></div><div style="margin-top:8px"><strong>Table '+esc(o.table_no)+'</strong> · '+esc(o.guest_name)+'</div><div class="order-items">'+(o.items||[]).map(i=>'<div class="order-item-line"><span>'+esc(i.name)+' × '+i.qty+'</span><strong>'+currency(i.price*i.qty)+'</strong></div>').join("")+'</div><div style="display:flex;justify-content:space-between;font-weight:800"><span>Total</span><span>'+currency(o.total)+'</span></div><div class="order-actions">'+nextButtons(o)+'</div></article>').join(""):'<div class="empty">No orders in this view.</div>';
 $("statNew").textContent=orders.filter(o=>o.status==="new").length;
 $("statPreparing").textContent=orders.filter(o=>o.status==="preparing").length;
 $("statReady").textContent=orders.filter(o=>o.status==="ready").length;
 $("statRevenue").textContent=currency(orders.filter(o=>o.status!=="cancelled").reduce((s,o)=>s+Number(o.total||0),0));
 document.querySelectorAll("[data-status]").forEach(b=>b.onclick=()=>updateStatus(b.dataset.id,b.dataset.status));
}
async function updateStatus(id,status){
 if(!supabase)return;
 const {error}=await supabase.from("orders").update({status,updated_at:new Date().toISOString()}).eq("id",id);
 if(error)console.error(error);
}
async function init(){
 if(!supabase){setConnection("Demo mode — connect Supabase");render();return;}
 const r=await supabase.from("restaurants").select("id,name").eq("slug",RESTAURANT_SLUG).single();
 if(r.error){console.error(r.error);setConnection("Supabase error");return;}
 restaurantId=r.data.id;setConnection("Supabase live");
 const initial=await supabase.from("orders").select("*").eq("restaurant_id",restaurantId).order("created_at",{ascending:false});
 if(initial.error){console.error(initial.error);setConnection("Supabase error");return;}
 orders=initial.data||[];render();
 supabase.channel("orderly-orders").on("postgres_changes",{event:"*",schema:"public",table:"orders",filter:"restaurant_id=eq."+restaurantId},payload=>{
   if(payload.eventType==="INSERT")orders=[payload.new,...orders.filter(x=>x.id!==payload.new.id)];
   if(payload.eventType==="UPDATE")orders=orders.map(x=>x.id===payload.new.id?payload.new:x);
   if(payload.eventType==="DELETE")orders=orders.filter(x=>x.id!==payload.old.id);
   render();
 }).subscribe();
}
$("filters").onclick=e=>{const b=e.target.closest("[data-filter]");if(!b)return;activeFilter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));render();};
$("seedDemo").onclick=async()=>{if(!supabase)return alert("Connect Supabase first.");if(!restaurantId)await init();const samples=[{table_no:"T1",guest_name:"Rahul",items:[{name:"Masala Dosa",qty:2,price:120},{name:"Cold Coffee",qty:1,price:80}],total:320,status:"new"},{table_no:"T4",guest_name:"Priya",items:[{name:"Paneer Butter Masala",qty:1,price:210},{name:"Cold Coffee",qty:2,price:80}],total:370,status:"preparing"}];for(const x of samples)await supabase.from("orders").insert({...x,restaurant_id:restaurantId});};
$("clearDemo").onclick=async()=>{if(!supabase||!restaurantId)return;await supabase.from("orders").delete().eq("restaurant_id",restaurantId);};
init();