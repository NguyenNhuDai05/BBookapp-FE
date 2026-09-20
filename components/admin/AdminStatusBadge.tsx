import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AdminPayoutStatus } from '../../types/adminPayout';
import { Radius, Typography } from '../../constants/theme';

const config: Record<AdminPayoutStatus, { label: string; color: string; backgroundColor: string }> = {
  PENDING:{label:'Chờ tiếp nhận',color:'#9A6700',backgroundColor:'#FFF4CE'},
  MANUAL_ACTION_REQUIRED:{label:'Cần xử lý',color:'#9A3A12',backgroundColor:'#FFF0E8'},
  PROCESSING:{label:'Đang xử lý',color:'#175CD3',backgroundColor:'#EAF2FF'},
  PAID:{label:'Đã chi trả',color:'#067647',backgroundColor:'#ECFDF3'},
  FAILED:{label:'Thất bại',color:'#B42318',backgroundColor:'#FEF3F2'},
  UNKNOWN:{label:'Không xác định',color:'#475467',backgroundColor:'#F2F4F7'},
};

export function AdminStatusBadge({ status }: { status: AdminPayoutStatus }) {
  const value = config[status];
  return <View style={[styles.badge,{backgroundColor:value.backgroundColor}]}><Text style={[styles.text,{color:value.color}]}>{value.label}</Text></View>;
}

const styles=StyleSheet.create({badge:{alignSelf:'flex-start',paddingHorizontal:10,paddingVertical:5,borderRadius:Radius.full},text:{fontFamily:Typography.bold,fontSize:12}});
