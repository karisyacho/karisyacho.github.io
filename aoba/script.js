const menu=document.querySelector('.menu-toggle');
const navigation=document.querySelector('#navigation');
function closeMenu(){navigation?.classList.remove('open');menu?.setAttribute('aria-expanded','false');menu?.setAttribute('aria-label','メニューを開く');}
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';navigation.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く');});
navigation?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
window.matchMedia('(min-width:981px)').addEventListener('change',closeMenu);
const mobileActions=document.querySelector('.mobile-cta');
const hero=document.querySelector('.hero');
if(hero&&mobileActions)new IntersectionObserver(([entry])=>mobileActions.classList.toggle('is-visible',!entry.isIntersecting),{threshold:0}).observe(hero);
const services=[...document.querySelectorAll('.service-detail')];
services.forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)services.forEach(other=>{if(other!==detail)other.open=false;});}));
document.querySelector('[data-open-entry]')?.addEventListener('click',()=>{const target=document.querySelector('#entry-details');if(target)target.open=true;});
function openDialog(dialog){if(!dialog)return;closeMenu();dialog.showModal();document.body.classList.add('dialog-open');}
document.querySelectorAll('dialog').forEach(dialog=>{
 dialog.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
 dialog.addEventListener('close',()=>document.body.classList.remove('dialog-open'));
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
});

// Demo-only forms. No network sending, browser storage, or server persistence.
const form=document.querySelector('#inquiry-form');
if(form){
 const inquiry=document.querySelector('#inquiry-dialog');
 const confirmation=document.querySelector('#inquiry-confirmation');
 const summary=document.querySelector('#inquiry-summary');
 const status=document.querySelector('.copy-status');
 const kindInput=form.querySelector('[name=kind]');
 const businessFields=document.querySelector('#business-fields');
 const recruitFields=document.querySelector('#recruit-fields');
 let copyText='';
 function showForm(){form.hidden=false;confirmation.hidden=true;status.textContent='';confirmation.querySelector('.copy-fallback')?.remove();}
 function setKind(kind){
  if(!kindInput)return;
  const recruit=kind==='recruit';kindInput.value=recruit?'recruit':'business';
  businessFields.hidden=recruit;businessFields.disabled=recruit;recruitFields.hidden=!recruit;recruitFields.disabled=!recruit;
  document.querySelectorAll('[data-kind]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.kind===kindInput.value)));
  showForm();
 }
 document.querySelectorAll('[data-kind]').forEach(button=>button.addEventListener('click',()=>setKind(button.dataset.kind)));
 const params=new URLSearchParams(location.search);
 if(kindInput)setKind(params.get('kind')==='recruit'?'recruit':'business');
 const serviceValues={charter:'貸切輸送',regular:'定期配送',warehouse:'保管・入出庫'};
 if(serviceValues[params.get('service')])form.elements.service.value=serviceValues[params.get('service')];
 if(recruitFields&&['route','charter'].includes(params.get('job')))form.elements.job.value=params.get('job');
 document.querySelectorAll('[data-inquiry]').forEach(button=>button.addEventListener('click',()=>{showForm();form.elements.service.value=button.dataset.inquiry;openDialog(inquiry);}));
 form.addEventListener('submit',event=>{
  event.preventDefault();
  const recruit=kindInput?.value==='recruit';
  const required=recruit?['applicant','email']:['cargo','origin','destination'];
  for(const name of required){const input=form.elements[name];input.setCustomValidity(input.value.trim()?'':'内容を入力してください。');if(!input.reportValidity())return;}
  if(!form.reportValidity())return;
  const values=new FormData(form);
  const fields=recruit?[['気になる職種','job'],['お名前','applicant'],['メールアドレス','email'],['ご質問・相談内容','message']]:[['ご相談の内容','service'],['運びたい荷物','cargo'],['集荷地','origin'],['お届け先','destination'],['希望日・頻度','schedule']];
  const jobNames={route:'定期配送ドライバー',charter:'貸切便ドライバー',undecided:'未定・相談したい'};
  summary.replaceChildren();const lines=[];
  fields.forEach(([label,name])=>{let value=String(values.get(name)||'').trim()||'未定';if(name==='job')value=jobNames[value]||value;const row=document.createElement('div'),term=document.createElement('dt'),description=document.createElement('dd');term.textContent=label;description.textContent=value;row.append(term,description);summary.append(row);lines.push(label+'：'+value);});
  copyText='【制作見本・未送信】\n'+lines.join('\n');form.hidden=true;confirmation.hidden=false;confirmation.focus();
  if(inquiry)inquiry.scrollTop=0;else confirmation.scrollIntoView({block:'start',behavior:'auto'});
 });
 form.addEventListener('input',event=>event.target.setCustomValidity?.(''));
 document.querySelector('#edit-inquiry')?.addEventListener('click',()=>{confirmation.hidden=true;form.hidden=false;const first=form.elements[kindInput?.value==='recruit'?'applicant':'cargo'];first.focus();});
 document.querySelector('#copy-inquiry')?.addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(copyText);status.textContent='内容をコピーしました。問い合わせ・応募は送信されていません。';}
  catch{let field=confirmation.querySelector('.copy-fallback');if(!field){field=document.createElement('textarea');field.className='copy-fallback';field.readOnly=true;field.setAttribute('aria-label','コピー用の入力内容');confirmation.append(field);}field.value=copyText;field.focus();field.select();status.textContent='自動コピーを利用できません。下の内容を選択してコピーしてください。';}
 });
}
