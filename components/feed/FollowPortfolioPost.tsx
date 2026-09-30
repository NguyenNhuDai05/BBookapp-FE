import React from 'react';
import { PortfolioPost, PortfolioPostProps } from '../mua/portfolio/PortfolioPost';
import { useFollow } from '../../hooks/useFollow';
export function FollowPortfolioPost(props: PortfolioPostProps) {
  const follow = useFollow(props.item.muaId || props.item.authorId);
  return <PortfolioPost {...props} item={{ ...props.item, isFollowing: follow.status?.isFollowing ?? false }}
    onFollow={!follow.self && !follow.loading && !follow.error ? follow.toggle : undefined} />;
}
