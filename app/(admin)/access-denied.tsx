import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminAccessDenied } from '../../components/admin/AdminStates';
import { BrandColors } from '../../constants/theme';

export default function AdminAccessDeniedScreen(){
  return <SafeAreaView style={{flex:1,backgroundColor:BrandColors.bgPrimary}}><AdminAccessDenied/></SafeAreaView>;
}
