import {loadAdvisorMatches} from '../matchCatalog';
import {exploreService} from '../../../services/exploreService';
jest.mock('../../../services/exploreService',()=>({exploreService:{search:jest.fn()}}));
const item={id:'actual-service',muaId:'actual-mua',name:'Makeup',authorName:'MUA',price:200,durationMinutes:60,tags:['Korean'],imageUrls:[]};
beforeEach(()=>jest.clearAllMocks());
test('known style uses runtime ID and preserves actual backend items',async()=>{
 jest.mocked(exploreService.search).mockResolvedValue({items:[item],nextCursor:null});
 const result=await loadAdvisorMatches('services',{styleId:97,maxPrice:500},['Korean']);
 expect(exploreService.search).toHaveBeenCalledWith('services',{styleId:97,maxPrice:500},'',undefined,undefined);
 expect(result.items[0]).toBe(item);expect(result.weak).toBe(false);
});
test('unmapped style uses model keyword, then broad real results with weak label and same budget/location',async()=>{
 jest.mocked(exploreService.search).mockResolvedValueOnce({items:[],nextCursor:null}).mockResolvedValueOnce({items:[item],nextCursor:null});
 const result=await loadAdvisorMatches('services',{provinceCode:79,maxPrice:500},['Trang điểm dự tiệc']);
 expect(jest.mocked(exploreService.search).mock.calls[0][2]).toBe('Trang điểm dự tiệc');
 expect(jest.mocked(exploreService.search).mock.calls[1][1]).toEqual({provinceCode:79,maxPrice:500,styleId:undefined});
 expect(result.weak).toBe(true);expect(result.items).toEqual([item]);
});
test('empty matching remains empty and failure never invents records',async()=>{
 jest.mocked(exploreService.search).mockResolvedValue({items:[],nextCursor:null});
 expect((await loadAdvisorMatches('artists',{styleId:97},['Korean'])).items).toEqual([]);
 jest.mocked(exploreService.search).mockRejectedValue(new Error('offline'));
 await expect(loadAdvisorMatches('services',{},['Korean'])).rejects.toThrow('offline');
});

test('approved stable style key uses server multi-ID mapping and fallback clears only style filters', async () => {
 jest.mocked(exploreService.search).mockResolvedValueOnce({items:[],nextCursor:null}).mockResolvedValueOnce({items:[item],nextCursor:null});
 const result=await loadAdvisorMatches('services',{advisorStyleKey:'soft-korean',provinceCode:79,minPrice:100,maxPrice:500},['Ignored name']);
 expect(exploreService.search).toHaveBeenNthCalledWith(1,'services',{advisorStyleKey:'soft-korean',provinceCode:79,minPrice:100,maxPrice:500},'',undefined,undefined);
 expect(jest.mocked(exploreService.search).mock.calls[1][1]).toEqual({advisorStyleKey:undefined,styleId:undefined,provinceCode:79,minPrice:100,maxPrice:500});
 expect(result.weak).toBe(true);
});
