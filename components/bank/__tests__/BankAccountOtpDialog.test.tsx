import React from 'react';
import {fireEvent,render,screen} from '@testing-library/react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {OverlayProvider} from '../../ui/OverlayProvider';
import {BankAccountOtpDialog} from '../BankAccountOtpDialog';

const metrics={frame:{x:0,y:0,width:390,height:844},insets:{top:24,bottom:24,left:0,right:0}};
const Wrapper=({children}:React.PropsWithChildren)=><SafeAreaProvider initialMetrics={metrics}><OverlayProvider>{children}</OverlayProvider></SafeAreaProvider>;

it('shows masked email and only enables confirmation for exactly six digits',async()=>{
  const confirm=jest.fn(async()=>{});
  await render(<BankAccountOtpDialog info={{maskedEmail:'n***@gmail.com',expiresInSeconds:300,resendAfterSeconds:60}} loading={false} onClose={jest.fn()} onConfirm={confirm} onResend={jest.fn(async()=>({maskedEmail:'n***@gmail.com',expiresInSeconds:300,resendAfterSeconds:60}))} onError={jest.fn()}/>,{wrapper:Wrapper});
  expect(screen.getByText(/n\*\*\*@gmail\.com/)).toBeTruthy();
  const button=screen.getByRole('button',{name:'Xác nhận'});expect(button.props.accessibilityState.disabled).toBe(true);
  await fireEvent.changeText(screen.getByTestId('bank-otp-input'),'12a34567');expect(screen.getByTestId('bank-otp-input').props.value).toBe('123456');
  expect(screen.getByRole('button',{name:'Xác nhận'}).props.accessibilityState.disabled).toBe(false);
  await fireEvent.press(screen.getByRole('button',{name:'Xác nhận'}));expect(confirm).toHaveBeenCalledWith('123456');
  expect(screen.getByText('Gửi lại sau 60s')).toBeTruthy();
});
