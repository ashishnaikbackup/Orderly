// Orderly restaurant dashboard — Supabase Realtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cfg=window.ORDERLY_SUPABASE_CONFIG||{};
const supabase=cfg.url&&cfg.anonKey&&!String(cfg.url).includes("REPLACE_ME")?createClient(cfg.url,cfg.anonKey):null;
const RESTAURANT_SLUG="orderly-demo";
let restaurantId=null,orders=[],filter="all";
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const money=n=>"₹"+Number(n||0).toLocaleString("en-IN");

function dateFrom(o){return o.created_at?new Date(o.created_at):new Date();}
function statusName(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function nextButtons(o){
 const b=[];
 if(o.status==="new")b.push('<button class="btn primary" data-status="preparing" data-id="'+o.id+'">Start preparing</button>');
 if(o.status==="preparing")b.push('<button class="btn primary" data-status="ready" data-id="'+o.id+'">Mark ready</button>');
 if(o.status==="ready")b.push('<button class="btn primary" data-status="completed" data-id="'+o.id+'">Complete</button>');
 if(!["completed","cancelled"].includes(o.status))b.push('<button class="btn ghost" data-status="cancelled" data-id="'+o.id+'">Cancel</button>');
 return b.join("");
}
function render(){
 const visible=orders.filter(o=>filter==="all"||o.status===filter).sort((a,b)=>dateFrom(b)-dateFrom(a));
 $("orders").innerHTML=visible.length?visible.map(o=>'<article class="order-card"><div class="order-top"><div><strong>#'+String(o.id).slice(-6).toUpperCase()+'</strong><div class="order-id">'+dateFrom(o).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})+'</div></div><span class="pill '+esc(o.status)+'">'+statusName(o.status)+'</span></div><div style="margin-top:8px"><strong>Table '+esc(o.table_no)+'</strong> · '+esc(o.guest_name)+'</div><div class="order-items">'+(Array.isArray(o.items)?o.items:[]).map(i=>'<div class="order-item-line"><span>'+esc(i.name)+' × '+i.qty+'</span><strong>'+money(i.price*i.qty)+'</strong></div>').join("")+'</div><div style="display:flex;justify-content:space-between;font-weight:800"><span>Total</span><span>'+money(o.total)+'</span></div><div class="order-actions">'+nextButtons(o)+'</div></article>').join(""):'<div class="empty">No orders in this view.</div>';
 $("statNew").textContent=orders.filter(o=>o.status==="new").length;
 $("statPreparing").textContent=orders.filter(o=>o.status==="preparing").length;
 $("statReady").textContent=orders.filter(o=>o.status==="ready").length;
 $("statRevenue").textContent=money(orders.filter(o=>o.status!=="cancelled").reduce((s,o)=>s+Number(o.total||0),0));
 document.querySelectorAll("[data-status]").forEach(b=>b.onclick=()=>updateStatus(b.dataset.id,b.dataset.status));
}
async function updateStatus(id,status){
 if(!supabase||!restaurantId)return;
 const {error}=await supabase.from("orders").update({status,updated_at:new Date().toISOString()}).eq("id",id).eq("restaurant_id",restaurantId);
 if(error)console.error("Order update failed:",error);
}
async function loadOrders(){
 const {data,error}=await supabase.from("orders").select("*").eq("restaurant_id",restaurantId).order("created_at",{ascending:false});
 if(error)throw error;orders=data||[];render();
}
async function init(){
 if(!supabase){$("connectionState").textContent="Demo mode — connect Supabase";return;}
 try{
  const r=await supabase.from("restaurants").select("id,name").eq("slug",RESTAURANT_SLUG).single();
  if(r.error)throw r.error;
  restaurantId=r.data.id;$("connectionState").textContent="Supabase live";
  await loadOrders();
  supabase.channel("orderly-orders")
   .on("postgres_changes",{event:"*",schema:"public",table:"orders",filter:"restaurant_id=eq."+restaurantId},async()=>{try{await loadOrders();}catch(e){console.error(e);}})
   .subscribe();
 }catch(e){console.error(e);$("connectionState").textContent="Supabase error";}
}
$("filters").onclick=e=>{const b=e.target.closest("[data-filter]");if(!b)return;filter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));render();};
$("seedDemo").onclick=async()=>{
 if(!supabase||!restaurantId){alert("Supabase is not connected.");return;}
 const rows=[
  {restaurant_id:restaurantId,table_no:"T1",guest_name:"Rahul",items:[{name:"Masala Dosa",qty:2,price:120},{name:"Cold Coffee",qty:1,price:80}],total:320,status:"new"},
  {restaurant_id:restaurantId,table_no:"T4",guest_name:"Priya",items:[{name:"Paneer Butter Masala",qty:1,price:210},{name:"Cold Coffee",qty:2,price:80}],total:370,status:"preparing"}
 ];
 const {error}=await supabase.from("orders").insert(rows);if(error)console.error(error);
};
$("clearDemo").onclick=async()=>{
 if(!supabase||!restaurantId){alert("Supabase is not connected.");return;}
 if(confirm("Delete all demo orders for this restaurant?")){const {error}=await supabase.from("orders").delete().eq("restaurant_id",restaurantId);if(error)console.error(error);}
};
init();