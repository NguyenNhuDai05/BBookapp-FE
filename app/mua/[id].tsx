import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { validProfileId } from '../../utils/profileLinks';
export default function SharedProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={validProfileId(id) ? { pathname: '/mua-detail', params: { id } } : '/profile-unavailable'} />;
}
