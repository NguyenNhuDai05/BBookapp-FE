import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { validProfileId } from '../../utils/profileLinks';
export default function SharedPostLink() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <Redirect href={validProfileId(id) ? { pathname: '/shared-post', params: { id } } : '/profile-unavailable'} />;
}
