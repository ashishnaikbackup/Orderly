import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cfg=window.ORDERLY_SUPABASE_CONFIG||{};
const supabase=cfg.url&&cfg.anonKey&&!String(cfg.url).includes("REPLACE_ME")?createClient(cfg.url,cfg.anonKey):null;
const $=id=>document.getElementById(id);
function msg(t,ok=false){$("msg").textContent=t;$("msg").style.color=ok?"#1d6b31":"";}
async function init(){if(!supabase){msg("Supabase is not configured.");return;}const {data}=await supabase.auth.getSession();if(data.session)location.href="admin.html";}
async function login(){const email=$("email").value.trim(),password=$("password").value;if(!email||!password){msg("Enter your email and password.");return;}$("loginBtn").disabled=true;const {error}=await supabase.auth.signInWithPassword({email,password});$("loginBtn").disabled=false;if(error){msg("Sign-in failed. Check your credentials or email verification.");return;}const {data:{user}}=await supabase.auth.getUser();if(!user){msg("No authenticated user returned.");return;}const {data:staff,error:staffError}=await supabase.from("restaurant_staff").select("role").eq("user_id",user.id);if(staffError||!staff?.length){await supabase.auth.signOut();msg("Login succeeded, but this account is not assigned to the Orderly restaurant.");return;}location.href="admin.html";}
$("loginBtn").onclick=login;$("password").onkeydown=e=>{if(e.key==="Enter")login();};init();