import {useInfiniteQuery} from '@tanstack/react-query';
import type {ExploreFilters,ExploreKind} from '../../types/explore';
import {exploreService} from '../../services/exploreService';
import {loadAdvisorMatches} from './matchCatalog';
export function useAdvisorMatches(kind:ExploreKind,filters:ExploreFilters,keywords:string[],enabled:boolean){
 return useInfiniteQuery({queryKey:['advisor','matches',kind,filters,keywords],enabled,retry:false,staleTime:60000,
  initialPageParam:undefined as {cursor:string;weak:boolean;matchFilters:ExploreFilters;matchQuery:string}|undefined,
  queryFn:async({signal,pageParam})=>{
   if(!pageParam)return loadAdvisorMatches(kind,filters,keywords,signal);
   return {...await exploreService.search(kind,pageParam.matchFilters,pageParam.matchQuery,pageParam.cursor,signal),weak:pageParam.weak,matchFilters:pageParam.matchFilters,matchQuery:pageParam.matchQuery};
  },getNextPageParam:last=>last.nextCursor?{cursor:last.nextCursor,weak:last.weak,matchFilters:last.matchFilters,matchQuery:last.matchQuery}:undefined
 });
}
