import * as FS from 'expo-file-system/legacy';
import type {Photo} from './faceAnalysis';
// Only fresh expo-camera output; never gallery originals or a shared cache sweep.
function cameraCacheUri(uri:string){return !!FS.cacheDirectory&&uri.startsWith(FS.cacheDirectory)&&/^Camera\/[a-zA-Z0-9_-]+\.jpg$/.test(uri.slice(FS.cacheDirectory.length));}
export async function discardCameraPhoto(photo?:Photo){if(photo&&cameraCacheUri(photo.uri))await FS.deleteAsync(photo.uri,{idempotent:true}).catch(()=>undefined);}
export async function adoptCameraPhoto(photo:Photo):Promise<Photo>{
 if(!cameraCacheUri(photo.uri))throw {code:'E_INPUT'};
 const filename=photo.uri.slice(photo.uri.lastIndexOf('/')+1);
 const uri=FS.cacheDirectory+'bbook-advisor-input-camera-'+filename;
 try{await FS.moveAsync({from:photo.uri,to:uri});return {...photo,uri};}
 catch(error){await FS.deleteAsync(uri,{idempotent:true}).catch(()=>undefined);await discardCameraPhoto(photo);throw error;}
}
