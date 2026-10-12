import {useCallback,useEffect,useRef,useState} from 'react';
import {AppState,Platform} from 'react-native';
import {useFocusEffect} from 'expo-router';
import * as Picker from 'expo-image-picker';
import {Analysis,Photo,analyze,normalize,removePhoto,removeExpiredAdvisorPhotos,cancelNormalization,nativeAvailable,prepareMemoryGuard} from './faceAnalysis';
import {advisorEnabled} from './flags';
export function useAdvisor(){
 const [photo,setPhoto]=useState<Photo>();const [analysis,setAnalysis]=useState<Analysis>();const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const owned=useRef<Photo|undefined>(undefined);const generation=useRef(0);const gate=useRef(false);const alive=useRef(true);const normalizing=useRef(false);const scanning=useRef(false);
 const reset=useCallback(()=>{generation.current++;cancelNormalization();const old=owned.current;owned.current=undefined;setPhoto(undefined);setAnalysis(undefined);void removePhoto(old?.uri);},[]);
 useEffect(()=>{alive.current=true;if(advisorEnabled)void removeExpiredAdvisorPhotos();const sub=AppState.addEventListener('change',next=>{if(next!=='active'&&(normalizing.current||scanning.current)){generation.current++;if(normalizing.current)cancelNormalization();}});return()=>{alive.current=false;cancelNormalization();sub.remove();void removePhoto(owned.current?.uri);};},[]);
 useFocusEffect(useCallback(()=>()=>reset(),[reset]));
 async function pick(camera=false){if(gate.current||!advisorEnabled)return;gate.current=true;setBusy(true);setError('');setAnalysis(undefined);const id=++generation.current;let input:Photo|undefined;let output:Photo|undefined;
  try{
   if(!prepareMemoryGuard())throw new Error('photo-unavailable');
   if(camera){const p=await Picker.requestCameraPermissionsAsync();if(!p.granted)throw new Error('permission');}
   const options={mediaTypes:['images'] as Picker.MediaType[],base64:false,exif:false,quality:1,allowsEditing:false,cameraType:'front' as Picker.CameraType};
   const selected=camera?await Picker.launchCameraAsync(options):await Picker.launchImageLibraryAsync(options);
   if(selected.canceled)return;
   input=selected.assets[0];if(id!==generation.current)return;
   normalizing.current=true;output=await normalize(input);
   if(!alive.current||id!==generation.current){await removePhoto(output.uri);return;}
   const old=owned.current;owned.current=output;setPhoto(output);setAnalysis(undefined);await removePhoto(old?.uri);
  }catch{if(alive.current&&id===generation.current)setError('Không xử lý được ảnh. Hãy chọn JPEG, PNG hoặc WebP tĩnh; bạn vẫn có thể tư vấn theo sở thích.');}
  finally{normalizing.current=false;await removePhoto(input?.uri);gate.current=false;if(alive.current)setBusy(false);}
 }
 async function scan(){if(gate.current||!photo||!advisorEnabled)return;gate.current=true;setBusy(true);setError('');const id=++generation.current;scanning.current=true;setAnalysis(undefined);
  try{const r=await analyze(photo);if(alive.current&&id===generation.current)setAnalysis(r);}catch{if(alive.current&&id===generation.current)setError('Tư vấn ảnh hiện chưa sẵn sàng. Bạn vẫn nhận gợi ý theo sở thích.');}
  finally{scanning.current=false;gate.current=false;if(alive.current)setBusy(false);}
 }
 return {photo,analysis,busy,error,reset,pick,scan,scanAvailable:Platform.OS==='android'&&nativeAvailable&&advisorEnabled};
}
