// Orderly guest ordering client — Supabase
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const params=new URLSearchParams(location.search);
const restaurantSlug=params.get("restaurant")||"orderly-demo";
const tableParam=params.get("table")||params.get("t")||"";
const cfg=window.ORDERLY_SUPABASE_CONFIG||{};
const ready=cfg.url&&cfg.anonKey&&!String(cfg.url).includes("REPLACE_ME");
const supabase=ready?createClient(cfg.url,cfg.anonKey):null;

const fallbackMenu=[
{id:"m1",name:"Masala Dosa",desc:"Crispy dosa with potato filling",price:120,category:"South Indian"},
{id:"m2",name:"Cold Coffee",desc:"Chilled, creamy and refreshing",price:80,category:"Drinks"},
{id:"m3",name:"Paneer Butter Masala",desc:"Rich tomato gravy with paneer",price:210,category:"Main Course"},
{id:"m4",name:"Margherita Pizza",desc:"Thin crust with mozzarella and basil",price:250,category:"Pizza"},
{id:"m5",name:"Veg Hakka Noodles",desc:"Wok-tossed noodles with vegetables",price:170,category:"Main Course"},
{id:"m6",name:"Masala Fries",desc:"Crispy fries with house seasoning",price:90,category:"Sides"}
];
let menuItems=fallbackMenu, cart=[], restaurantId=null, tableId=null, restaurantName="Orderly Demo Restaurant";
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

async function initData(){
 if(!supabase){setIdentity();renderMenu();renderCart();return;}
 try{
  const r=await supabase.from("restaurants").select("id,name,slug").eq("slug",restaurantSlug).single();
  if(r.error)throw r.error;
  restaurantId=r.data.id;restaurantName=r.data.name;setIdentity();
  const [menuRes,tableRes]=await Promise.all([
   supabase.from("menu_items").select("id,name,description,price,category,is_available").eq("restaurant_id",restaurantId).eq("is_available",true).order("category"),
   tableParam?supabase.from("tables").select("id,table_no,is_active").eq("restaurant_id",restaurantId).eq("table_no",tableParam).eq("is_active",true).maybeSingle():Promise.resolve({data:null,error:null})
  ]);
  if(!menuRes.error&&menuRes.data?.length)menuItems=menuRes.data.map(x=>({id:x.id,name:x.name,desc:x.description||"",price:Number(x.price),category:x.category}));
  if(!tableRes.error&&tableRes.data)tableId=tableRes.data.id;
  renderMenu();renderCart();setIdentity();
 }catch(e){console.error(e);setIdentity();renderMenu();renderCart();}
}
function setIdentity(){$("restaurantName").textContent=restaurantName;$("restaurantNameSmall").textContent=restaurantName;$("tableNo").value=tableParam;$("tableBadge").textContent=tableParam||"—";}
function renderMenu(){
 const cats=[...new Set(menuItems.map(x=>x.category))];
 $("menuItems").innerHTML=cats.map(c=>'<div class="menu-category"><h3>'+esc(c)+'</h3><div class="category-grid">'+menuItems.filter(x=>x.category===c).map(m=>'<article class="menu-card"><div><div class="menu-name">'+esc(m.name)+'</div><div class="menu-desc">'+esc(m.desc)+'</div></div><div class="menu-row"><strong class="menu-price">₹'+Number(m.price).toLocaleString("en-IN")+'</strong><button class="btn primary" data-add="'+m.id+'">Add</button></div></article>').join("")+'</div></div>').join("");
 document.querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>add(b.dataset.add));
}
function add(id){const x=menuItems.find(v=>String(v.id)===String(id));if(!x)return;const f=cart.find(v=>String(v.id)===String(id));f?f.qty++:cart.push({...x,qty:1});renderCart();}
function qty(id,d){const i=cart.findIndex(v=>String(v.id)===String(id));if(i<0)return;cart[i].qty+=d;if(cart[i].qty<=0)cart.splice(i,1);renderCart();}
function renderCart(){
 $("orderList").innerHTML=cart.length?cart.map(x=>'<div class="order-item"><div><strong>'+esc(x.name)+'</strong><div class="small">₹'+x.price+' each</div></div><div class="order-controls"><button class="qty" data-q="'+x.id+'" data-d="-1">−</button><span>'+x.qty+'</span><button class="qty" data-q="'+x.id+'" data-d="1">+</button><strong>₹'+x.price*x.qty+'</strong></div></div>').join(""):'<div class="small">Your cart is empty.</div>';
 $("cartTotal").textContent="₹"+cart.reduce((s,x)=>s+x.price*x.qty,0);
 $("itemCount").textContent=cart.reduce((s,x)=>s+x.qty,0);
 document.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>qty(b.dataset.q,+b.dataset.d));
}
$("clearCart").onclick=()=>{cart=[];renderCart();};
$("tableNo").oninput=e=>{tableId=null;$("tableBadge").textContent=e.target.value.trim()||"—";};
$("custName").oninput=e=>$("guestNameDisplay").textContent=e.target.value.trim()||"—";

async function placeOrder(){
 const guest=$("custName").value.trim(),table=$("tableNo").value.trim(),phone=$("phone").value.trim();
 if(!guest)return msg("Please enter your name.");
 if(!table)return msg("Please enter or scan a table number.");
 if(!cart.length)return msg("Add at least one item to your cart.");
 if(supabase&&restaurantId&&!tableId){
  const tr=await supabase.from("tables").select("id").eq("restaurant_id",restaurantId).eq("table_no",table).eq("is_active",true).maybeSingle();
  if(tr.error||!tr.data)return msg("That table is not active. Please scan the correct table QR.");
  tableId=tr.data.id;
 }
 const items=cart.map(x=>({id:String(x.id),name:x.name,price:Number(x.price),qty:x.qty}));
 const total=items.reduce((s,x)=>s+x.price*x.qty,0);
 try{
  if(!supabase||!restaurantId)throw Error("Supabase not connected");
  const {data,error}=await supabase.from("orders").insert({restaurant_id:restaurantId,table_id:tableId,table_no:table,guest_name:guest,phone:phone||null,items,total,status:"new"}).select("id").single();
  if(error)throw error;
  cart=[];renderCart();$("custName").value="";$("phone").value="";
  $("orderMsg").innerHTML='<div class="success">Order <strong>#'+String(data.id).slice(-6).toUpperCase()+'</strong> received for table <strong>'+esc(table)+'</strong>.</div>';
 }catch(e){
  console.error(e);
  const local={id:"local-"+Date.now(),restaurant,table_no:table,guest_name:guest,phone,items,total,status:"new",created_at:new Date().toISOString()};
  const stored=JSON.parse(localStorage.getItem("orderly_local_orders")||"[]");stored.push(local);localStorage.setItem("orderly_local_orders",JSON.stringify(stored));
  cart=[];renderCart();msg("Demo mode: order saved on this device. Connect Supabase to enable the live dashboard.");
 }
}
function msg(x){$("orderMsg").textContent=x;}
$("placeOrderBtn").onclick=placeOrder;
initData();