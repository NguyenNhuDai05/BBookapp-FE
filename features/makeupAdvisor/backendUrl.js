exports.isHttpsAdvisorUrl=function(value){
 if(typeof value!=='string')return false;
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash&&(!u.port||u.port==='443')&&/^\/api\/?$/.test(u.pathname)&&u.hostname.includes('.')&&!/^[\d.:\[\]]+$/.test(u.hostname)&&!/(^|\.)(localhost|local|internal)$/.test(u.hostname);}catch{return false;}
}
