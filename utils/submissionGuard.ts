export const createSubmissionGuard=()=>{
  let active=false;
  return async(task:()=>Promise<void>|void)=>{
    if(active)return false;
    active=true;
    try{await task();return true;}finally{active=false;}
  };
};
