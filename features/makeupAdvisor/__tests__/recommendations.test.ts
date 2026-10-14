import {resolveStyles,hasServiceStyleTag} from '../recommendations';
import type {ExploreService} from '../../../types/explore';
test('catalog resolves exact names dynamically, never substring guesses or IDs',()=>{expect(resolveStyles(['Korean'],[{id:42,name:'Korean',artistCount:1},{id:9,name:'Korean Special',artistCount:1}]).map(s=>s.id)).toEqual([42]);expect(resolveStyles(['Unknown'],[])).toEqual([]);});
test('artist-style result is not mislabelled as service-tag evidence',()=>{const item={tags:['Sự kiện khác']} as ExploreService;const style={id:91,name:'Sự kiện',artistCount:1};expect(hasServiceStyleTag(item,style)).toBe(false);expect(hasServiceStyleTag({...item,tags:['Sự kiện']},style)).toBe(true);});
