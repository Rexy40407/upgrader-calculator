import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source=readFileSync(new URL('../auth-guard.js',import.meta.url),'utf8');

function runGuard(session){
  const values=new Map();
  if(session) values.set('nexo-session',JSON.stringify(session));
  const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  const location={origin:'https://rexy40407.github.io',pathname:'/upgrader-calculator/',search:'',hash:'',replaced:null,replace(url){this.replaced=url}};
  const document={documentElement:{classList:{removed:null,remove(value){this.removed=value}}},querySelector:()=>null};
  vm.runInNewContext(source,{localStorage:storage,sessionStorage:storage,location,document,URL,Date,JSON,addEventListener(){}});
  return {location,document};
}

test('sem sessão redireciona para o login e preserva o destino',()=>{
  const {location}=runGuard(null);
  assert.equal(location.replaced,'https://rexy40407.github.io/nexo-login/?return=%2Fupgrader-calculator%2F');
});

test('com sessão válida revela a calculadora',()=>{
  const {location,document}=runGuard({username:'upgrade',expiresAt:Date.now()+60000});
  assert.equal(location.replaced,null);
  assert.equal(document.documentElement.classList.removed,'auth-pending');
});

test('sessão expirada volta ao login',()=>{
  const {location}=runGuard({username:'upgrade',expiresAt:Date.now()-1});
  assert.match(location.replaced,/\/nexo-login\/\?return=/);
});
