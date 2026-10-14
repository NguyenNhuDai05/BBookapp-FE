import React from 'react';
import {fireEvent,render,screen,waitFor} from '@testing-library/react-native';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {AdvisorResults} from '../AdvisorResults';
import {AdvisorMarketplace} from '../AdvisorMarketplace';
import {exploreService} from '../../../services/exploreService';
import {presentationCatalog,catalogLabels} from '../presentationCatalog';
import {styleImages,colorFor} from '../styleImages';
import type {ExploreHome} from '../../../types/explore';
import type {MakeupRecommendation} from '../advisorRecommendation';
jest.mock('react-native-safe-area-context',()=>jest.requireActual('react-native-safe-area-context/jest/mock').default);
jest.mock('../../../services/exploreService',()=>({exploreService:{search:jest.fn(),advisorMappings:jest.fn()}}));
jest.mock('../../../components/ui/SkeletonLoader',()=>({SkeletonLoader:()=>null}));
const mockPush=jest.fn();jest.mock('expo-router',()=>({useRouter:()=>({push:mockPush})}));
const row={styleKey:'soft-korean',title:'Korean result',shortDescription:'Description',colorSuggestions:['Hồng phấn'],occasionFit:['Đi làm'],serviceQueryKeywords:['Korean'],makeupFocus:[],whyItFits:'Reference'} as MakeupRecommendation;
const catalog={styles:[{id:97,name:'Korean',artistCount:1}],provinces:[],featuredPosts:[],featuredArtists:[],featuredServices:[]} as ExploreHome;
const service={id:'svc',muaId:'mua',name:'Dịch vụ thật',authorName:'MUA thật',price:350000,durationMinutes:60,imageUrls:[],tags:[]};
const artist={id:'mua',name:'MUA thật',rating:4.8,reviewCount:42,styles:['Korean']};
let client:QueryClient;
beforeEach(()=>{jest.clearAllMocks();jest.mocked(exploreService.advisorMappings).mockResolvedValue([{styleKey:'soft-korean',styleIds:[97,98]}]);client=new QueryClient({defaultOptions:{queries:{retry:false,gcTime:0}}});jest.mocked(exploreService.search).mockImplementation(async kind=>({items:kind==='services'?[service]:[artist],nextCursor:null}));});
afterEach(()=>client.clear());
async function mount(){return render(<QueryClientProvider client={client}><AdvisorMarketplace catalog={catalog} recommendations={[row]}/></QueryClientProvider>);}
test('uses the reviewed mapping even when catalog names differ and never chooses an ID by alias',async()=>{
 const changedCatalog={...catalog,styles:[{id:999,name:'Korean',artistCount:20}]};
 const h=await render(<QueryClientProvider client={client}><AdvisorMarketplace catalog={changedCatalog} recommendations={[row]}/></QueryClientProvider>);
 await waitFor(()=>expect(exploreService.search).toHaveBeenCalledTimes(2));
 expect(jest.mocked(exploreService.search).mock.calls.every(call=>call[1].advisorStyleKey==='soft-korean' && call[1].styleId===undefined && call[2]==='')).toBe(true);
 await h.unmount();
});
test('20 styles have explicit asset slots and all catalog palette colors resolve',()=>{expect(Object.keys(styleImages).sort()).toEqual(presentationCatalog.map(s=>s.imageKey).sort());for(const s of presentationCatalog)for(const c of catalogLabels(s,'colorPaletteLabels'))expect(colorFor(c)).toMatch(/^#[0-9a-f]{6}$/i);});
test('real prices, reviews and existing routes work without GPS or favorite controls',async()=>{const h=await mount();await waitFor(()=>expect(screen.getByText('350.000đ')).toBeTruthy());expect(screen.getByText('4.8 (42)')).toBeTruthy();expect(screen.queryByText(/km/)).toBeNull();await fireEvent.press(screen.getByText('Xem dịch vụ'));expect(mockPush).toHaveBeenCalledWith({pathname:'/mua-detail',params:{id:'mua',tab:'Dịch vụ',serviceId:'svc'}});await fireEvent.press(screen.getByText('Xem hồ sơ'));expect(mockPush).toHaveBeenCalledWith({pathname:'/mua-detail',params:{id:'mua'}});expect(exploreService.search).toHaveBeenCalledTimes(2);await h.unmount();});
test('service error does not block real artists and retry is scoped to services',async()=>{jest.mocked(exploreService.search).mockImplementation(async kind=>{if(kind==='services')throw Error('offline');return {items:[artist],nextCursor:null};});const h=await mount();await waitFor(()=>expect(screen.getByText('Thử tải dịch vụ lại')).toBeTruthy());expect(screen.getByText('Xem hồ sơ')).toBeTruthy();expect(screen.queryByText('Thử tải MUA lại')).toBeNull();await fireEvent.press(screen.getByText('Thử tải dịch vụ lại'));await waitFor(()=>expect(exploreService.search).toHaveBeenCalledTimes(3));await h.unmount();});
test('empty real responses retain separate empty sections and never invent prices',async()=>{jest.mocked(exploreService.search).mockResolvedValue({items:[],nextCursor:null});const h=await mount();await waitFor(()=>expect(screen.getByText('Chưa có dịch vụ phù hợp để gợi ý lúc này.')).toBeTruthy());await waitFor(()=>expect(screen.getByText('Hiện chưa có chuyên viên phù hợp với phong cách này.')).toBeTruthy());expect(screen.queryByText('350.000đ')).toBeNull();await h.unmount();});
test('opening all does not refetch; load more uses the cursor and deduplicates records',async()=>{jest.mocked(exploreService.search).mockImplementation(async(kind,_,__,cursor)=>({items:kind==='services'?[service]:[artist],nextCursor:kind==='services'&&!cursor?'next':null}));const h=await mount();await waitFor(()=>expect(screen.getByText('350.000đ')).toBeTruthy());await fireEvent.press(screen.getByLabelText('Xem tất cả dịch vụ'));expect(exploreService.search).toHaveBeenCalledTimes(2);await fireEvent.press(screen.getByText('Tải thêm'));await waitFor(()=>expect(exploreService.search).toHaveBeenCalledTimes(3));expect(jest.mocked(exploreService.search).mock.calls[2][3]).toBe('next');await h.unmount();});
test('missing images, ratings and portfolio do not crash',async()=>{jest.mocked(exploreService.search).mockResolvedValue({items:[{...artist,rating:undefined,reviewCount:undefined,styles:undefined}] as any,nextCursor:null});const h=await mount();await waitFor(()=>expect(screen.getByText('Chưa có đánh giá')).toBeTruthy());expect(screen.getAllByText('Ảnh đang được bổ sung').length).toBeGreaterThan(0);await h.unmount();});

test('API failure preserves engine ranking and opening details/catalog never reanalyzes or refetches',async()=>{
 jest.mocked(exploreService.search).mockImplementation(async kind=>{if(kind==='services')throw Error('offline');return {items:[artist],nextCursor:null};});
 const onStyle=jest.fn();const rows=[row,{...row,styleKey:'peach',title:'Peach result'},{...row,styleKey:'latte',title:'Latte result'}];
 const h=await render(<QueryClientProvider client={client}><AdvisorResults result={{source:'local',recommendations:rows}} catalog={catalog} onStyle={onStyle} onReset={jest.fn()}/></QueryClientProvider>);
 await waitFor(()=>expect(screen.getByText('Thử tải dịch vụ lại')).toBeTruthy());
 expect(screen.getByLabelText('Hạng 1, Trang điểm Hàn Quốc nhẹ nhàng, mở hướng dẫn makeup')).toBeTruthy();expect(screen.getByLabelText('Hạng 2, Trang điểm tông đào ngọt ngào, mở hướng dẫn makeup')).toBeTruthy();expect(screen.getByLabelText('Hạng 3, Trang điểm tông Latte ấm áp, mở hướng dẫn makeup')).toBeTruthy();
 await fireEvent.press(screen.getByLabelText('Xem chi tiết Trang điểm Hàn Quốc nhẹ nhàng'));expect(screen.getByText('Lý do gợi ý')).toBeTruthy();await fireEvent.press(screen.getByText('Quay về Top 3'));expect(screen.getByLabelText('Xem chi tiết Trang điểm Hàn Quốc nhẹ nhàng')).toBeTruthy();
 await fireEvent.press(screen.getByText('Khám phá phong cách khác'));await fireEvent.press(screen.getByText(presentationCatalog[1].displayName));expect(screen.getByText('Dấu ấn phong cách')).toBeTruthy();await fireEvent.press(screen.getByText('Quay về catalog'));
 expect(exploreService.search).toHaveBeenCalledTimes(2);await h.unmount();
});

test('keyword pagination preserves the actual search and cursor filter',async()=>{
 const unmapped={...row,styleKey:'unknown-style'};
 jest.mocked(exploreService.search).mockImplementation(async(kind,_,__,cursor)=>({items:kind==='services'?[service]:[artist],nextCursor:kind==='services'&&!cursor?'keyword-next':null}));
 const h=await render(<QueryClientProvider client={client}><AdvisorMarketplace catalog={catalog} recommendations={[unmapped]}/></QueryClientProvider>);
 await waitFor(()=>expect(screen.getByText('350.000đ')).toBeTruthy());await fireEvent.press(screen.getByLabelText('Xem tất cả dịch vụ'));await fireEvent.press(screen.getByText('Tải thêm'));
 await waitFor(()=>expect(exploreService.search).toHaveBeenCalledTimes(3));const next=jest.mocked(exploreService.search).mock.calls[2];expect(next[2]).toBe('Korean');expect(next[3]).toBe('keyword-next');expect(next[1].styleId).toBeUndefined();await h.unmount();
});

test('effect nominee changes marketplace queries to the new stable style without duplicate fetches',async()=>{
 client.setDefaultOptions({queries:{retry:false,gcTime:60000}});
 const after={...row,styleKey:'sunkissed',title:'Sunkissed',scoringMetadataVersion:'1.2',selectionBasis:'explicit-effect-slot',serviceQueryKeywords:['Sun-Kissed Makeup']} as MakeupRecommendation;
 const h=await render(<QueryClientProvider client={client}><AdvisorMarketplace catalog={catalog} recommendations={[row]}/></QueryClientProvider>);await waitFor(()=>expect(screen.getByText('350.000đ')).toBeTruthy());expect(exploreService.search).toHaveBeenCalledTimes(2);
 await h.rerender(<QueryClientProvider client={client}><AdvisorMarketplace catalog={catalog} recommendations={[row,after]}/></QueryClientProvider>);await waitFor(()=>expect(exploreService.search).toHaveBeenCalledTimes(4));expect(jest.mocked(exploreService.search).mock.calls.slice(2).every(c=>c[2]==='Sun-Kissed Makeup')).toBe(true);
 await h.rerender(<QueryClientProvider client={client}><AdvisorMarketplace catalog={catalog} recommendations={[row]}/></QueryClientProvider>);expect(exploreService.search).toHaveBeenCalledTimes(4);await h.unmount();
});
