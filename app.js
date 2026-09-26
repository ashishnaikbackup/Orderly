// Orderly guest ordering client
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const urlParams=new URLSearchParams(location.search);
const restaurant=urlParams.get("restaurant")||urlParams.get("rest")||"Orderly Restaurant";
const tableParam=urlParams.get("table")||urlParams.get("t")||"";
const config=window.ORDERLY_FIREBASE_CONFIG||{};
const firebaseReady=!!(config.apiKey&&!String(config.apiKey).includes("REPLACE_ME"));
let db=null;
if(firebaseReady){try{db=getFirestore(initializeApp(config));}catch(e){console.error(e);}}

let cart=[];
const menuItems=[
{id:"m1",name:"Masala Dosa",desc:"Crispy dosa with potato filling",price:120,category:"South Indian"},
{id:"m2",name:"Cold Coffee",desc:"Chilled, creamy and refreshing",price:80,category:"Drinks"},
{id:"m3",name:"Paneer Butter Masala",desc:"Rich tomato gravy with paneer",price:210,category:"Main Course"},
{id:"m4",name:"Margherita Pizza",desc:"Thin crust with mozzarella and basil",price:250,category:"Pizza"},
{id:"m5",name:"Veg Hakka Noodles",desc:"Wok-tossed noodles with vegetables",price:170,category:"Main Course"},
{id:"m6",name:"Masala Fries",desc:"Crispy fries with house seasoning",price:90,category:"Sides"}
];

const $=id=>document.getElementById(id);
$("restaurantName").textContent=restaurant;
$("restaurantNameSmall").textContent=restaurant;
$("tableNo").value=tableParam;
$("tableBadge").textContent=tableParam||"—";

function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function renderMenu(){
 const categories=[...new Set(menuItems.map(x=>x.category))];
 $("menuItems").innerHTML=categories.map(cat=>'<div class="menu-category"><h3>'+escapeHtml(cat)+'</h3><div class="category-grid">'+menuItems.filter(x=>x.category===cat).map(m=>'<article class="menu-card"><div><div class="menu-name">'+escapeHtml(m.name)+'</div><div class="menu-desc">'+escapeHtml(m.desc)+'</div></div><div class="menu-row"><strong class="menu-price">₹'+m.price+'</strong><button class="btn primary" data-add="'+m.id+'">Add</button></div></article>').join("")+'</div></div>').join("");
 document.querySelectorAll("[data-add]").forEach(b=>b.addEventListener("click",()=>addToCart(b.dataset.add)));
}
function addToCart(id){const item=menuItems.find(x=>x.id===id);if(!item)return;const found=cart.find(x=>x.id===id);found?found.qty++:cart.push({...item,qty:1});renderCart();}
function changeQty(id,delta){const i=cart.findIndex(x=>x.id===id);if(i<0)return;cart[i].qty+=delta;if(cart[i].qty<=0)cart.splice(i,1);renderCart();}
function renderCart(){
 $("orderList").innerHTML=cart.length?cart.map(x=>'<div class="order-item"><div><strong>'+escapeHtml(x.name)+'</strong><div class="small">₹'+x.price+' each</div></div><div class="order-controls"><button class="qty" data-q="'+x.id+'" data-d="-1">−</button><span>'+x.qty+'</span><button class="qty" data-q="'+x.id+'" data-d="1">+</button><strong>₹'+x.price*x.qty+'</strong></div></div>').join(""):'<div class="small">Your cart is empty.</div>';
 const total=cart.reduce((s,x)=>s+x.price*x.qty,0);
 $("cartTotal").textContent="₹"+total;
 $("itemCount").textContent=cart.reduce((s,x)=>s+x.qty,0);
 document.querySelectorAll("[data-q]").forEach(b=>b.addEventListener("click",()=>changeQty(b.dataset.q,Number(b.dataset.d))));
}
$("clearCart").addEventListener("click",()=>{cart=[];renderCart();});
$("tableNo").addEventListener("input",e=>$("tableBadge").textContent=e.target.value.trim()||"—");
$("custName").addEventListener("input",e=>$("guestNameDisplay").textContent=e.target.value.trim()||"—");

async function placeOrder(){
 const guest=$("custName").value.trim(),table=$("tableNo").value.trim(),phone=$("phone").value.trim();
 if(!guest)return showMsg("Please enter your name.");
 if(!table)return showMsg("Please enter or scan a table number.");
 if(!cart.length)return showMsg("Add at least one item to your cart.");
 const items=cart.map(x=>({id:x.id,name:x.name,price:x.price,qty:x.qty}));
 const total=items.reduce((s,x)=>s+x.price*x.qty,0);
 try{
  if(!db) throw new Error("Firebase not configured");
  const order={restaurantId:restaurant.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"restaurant",restaurant,table,guest,phone,items,total,status:"new",createdAt:serverTimestamp()};
  const ref=await addDoc(collection(db,"orders"),order);
  localStorage.setItem("orderly_last_order",JSON.stringify({id:ref.id,table,restaurant}));
  cart=[];renderCart();$("custName").value="";$("phone").value="";
  $("orderMsg").innerHTML='<div class="success">Order <strong>#'+ref.id.slice(-6).toUpperCase()+'</strong> received. Your table is <strong>'+escapeHtml(table)+'</strong>.</div>';
 }catch(e){
  console.error(e);
  const local={restaurantId:"demo",restaurant,table,guest,phone,items,total,status:"new",createdAtMs:Date.now(),demo:true,id:"local-"+Date.now()};
  const stored=JSON.parse(localStorage.getItem("orderly_local_orders")||"[]");stored.push(local);localStorage.setItem("orderly_local_orders",JSON.stringify(stored));
  cart=[];renderCart();showMsg("Demo order saved on this device. Connect Firebase to send it to the live dashboard.");
 }
}
function showMsg(m){$("orderMsg").textContent=m;}
$("placeOrderBtn").addEventListener("click",placeOrder);
renderMenu();renderCart();