const chatBox=document.getElementById("chat-box"),userInput=document.getElementById("user-input"),sendBtn=document.getElementById("send-btn"),form=document.getElementById("chat-form"),usageCounter=document.getElementById("usage-counter");
const DAILY_LIMIT=50,usageKey="chatbot_daily_message_count";
function todayKey(){const d=new Date();return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`}
function getUsage(){try{const s=JSON.parse(localStorage.getItem(usageKey)||"null");if(!s||s.date!==todayKey())return 0;return Number(s.count)||0}catch{return 0}}
function setUsage(count){try{localStorage.setItem(usageKey,JSON.stringify({date:todayKey(),count}))}catch{}}
function updateUsage(){const c=getUsage();usageCounter.textContent=`${c} / ${DAILY_LIMIT} today`;return c}
updateUsage();
form.addEventListener("submit",e=>{e.preventDefault();sendMessage()});
async function sendMessage(){
 const message=userInput.value.trim();if(!message)return;
 const count=updateUsage();if(count>=DAILY_LIMIT){addBotMessage("You've reached the 50-message app limit for today. It will reset tomorrow.");return}
 addUserMessage(message);userInput.value="";
 const typing=document.createElement("div");typing.className="bot-message typing";typing.innerHTML='Typing<span class="dots">...</span>';chatBox.appendChild(typing);chatBox.scrollTop=chatBox.scrollHeight;sendBtn.disabled=true;
 try{
  const response=await fetch("/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message})});
  const data=await response.json();typing.remove();
  if(!response.ok&&response.status===429)addBotMessage("Gemini API quota/rate limit reached. Please try again later or use a higher-quota API plan.");
  else{addBotMessage(data.reply||"Sorry, I could not generate a response.");setUsage(count+1);updateUsage()}
 }catch(error){console.error(error);typing.remove();addBotMessage("Sorry, something went wrong. Please check that the server is running.")}
 finally{sendBtn.disabled=false;userInput.focus()}
}
function addUserMessage(text){const el=document.createElement("div");el.className="user-message";el.textContent=text;chatBox.appendChild(el);chatBox.scrollTop=chatBox.scrollHeight}
function addBotMessage(text){const el=document.createElement("div");el.className="bot-message";el.textContent=text;chatBox.appendChild(el);chatBox.scrollTop=chatBox.scrollHeight}