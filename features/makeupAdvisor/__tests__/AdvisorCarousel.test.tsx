import React from 'react';
import {Text} from 'react-native';
import {fireEvent,render,screen} from '@testing-library/react-native';
import {AdvisorCarousel} from '../AdvisorCarousel';

test('carousel exposes accessible next/previous controls only when the viewport overflows',async()=>{
 await render(<AdvisorCarousel label="Dịch vụ" itemWidth={168} count={3}><Text>Fixture</Text></AdvisorCarousel>);
 const list=screen.getByLabelText('Dịch vụ');
 expect(screen.queryByLabelText('Dịch vụ tiếp theo')).toBeNull();
 await fireEvent(list,'layout',{nativeEvent:{layout:{width:280,height:200}}});
 expect(screen.getByLabelText('Dịch vụ trước').props.accessibilityState.disabled).toBe(true);
 expect(screen.getByLabelText('Dịch vụ tiếp theo').props.accessibilityState.disabled).toBe(false);
 await fireEvent(list,'scroll',{nativeEvent:{contentOffset:{x:248,y:0}}});
 expect(screen.getByLabelText('Dịch vụ tiếp theo').props.accessibilityState.disabled).toBe(true);
 expect(screen.getByLabelText('Dịch vụ trước').props.accessibilityState.disabled).toBe(false);
 await fireEvent(list,'layout',{nativeEvent:{layout:{width:600,height:200}}});
 expect(screen.queryByLabelText('Dịch vụ tiếp theo')).toBeNull();
});
