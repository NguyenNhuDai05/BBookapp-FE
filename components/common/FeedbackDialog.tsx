import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BrandColors, Radius, Spacing, Typography } from '../../constants/theme';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  buttonLabel?: string;
  error?: boolean;
  onClose: () => void;
};

export function FeedbackDialog({ visible, title, message, buttonLabel = 'Đóng', error = false, onClose }: Props) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <View style={styles.card} accessibilityViewIsModal>
        <Text style={[styles.title,error&&styles.error]}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity style={[styles.button,error&&styles.errorButton]} onPress={onClose}>
          <Text style={styles.buttonText}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>;
}

const styles=StyleSheet.create({
  overlay:{flex:1,backgroundColor:'rgba(48,23,38,.45)',alignItems:'center',justifyContent:'center',padding:Spacing.base},
  card:{width:'100%',maxWidth:440,backgroundColor:'#FFF',borderRadius:Radius.xl,padding:Spacing.lg},
  title:{fontFamily:Typography.bold,fontSize:19,color:BrandColors.statusConfirmed},
  error:{color:BrandColors.statusCancelled},
  message:{fontFamily:Typography.regular,fontSize:14,lineHeight:21,color:BrandColors.textSecondary,marginTop:Spacing.sm},
  button:{minHeight:48,alignItems:'center',justifyContent:'center',borderRadius:Radius.full,backgroundColor:BrandColors.accentRose,marginTop:Spacing.lg},
  errorButton:{backgroundColor:BrandColors.statusCancelled},
  buttonText:{fontFamily:Typography.bold,color:'#FFF'},
});
