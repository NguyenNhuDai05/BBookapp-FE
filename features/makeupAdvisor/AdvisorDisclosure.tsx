import React,{useState} from 'react';
import {StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {ChevronDown,ChevronUp} from 'lucide-react-native';
import {advisorTheme as t} from './advisorTheme';

export function AdvisorDisclosure({title,summary,children}:{title:string;summary?:string;children:React.ReactNode}){
 const [open,setOpen]=useState(false);
 return <View style={s.panel}>
  <TouchableOpacity accessibilityRole="button" accessibilityState={{expanded:open}} onPress={()=>setOpen(v=>!v)} style={s.trigger}>
   <View style={s.copy}><Text style={s.title}>{title}</Text>{summary&&<Text style={s.summary}>{summary}</Text>}</View>
   {open?<ChevronUp size={18} color={t.accent}/>:<ChevronDown size={18} color={t.accent}/>}
  </TouchableOpacity>
  {open&&<View style={s.content}>{children}</View>}
 </View>;
}
const s=StyleSheet.create({panel:{borderWidth:1,borderColor:t.border,borderRadius:16,backgroundColor:t.surface},trigger:{minHeight:52,padding:14,flexDirection:'row',alignItems:'center',gap:12},copy:{flex:1,gap:4},title:{fontSize:14,lineHeight:21,fontWeight:'600',color:t.text},summary:{fontSize:12,lineHeight:18,color:t.body},content:{padding:14,paddingTop:0,gap:12}});
