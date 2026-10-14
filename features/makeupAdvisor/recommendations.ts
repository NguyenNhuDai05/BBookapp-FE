import type {ExploreStyle,ExploreService} from '../../types/explore';
const exact=(value:string)=>value.normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('vi');
export function resolveStyles(aliases:readonly string[],catalog:ExploreStyle[]) {return catalog.filter(style=>aliases.some(alias=>exact(alias)===exact(style.name)));}
export function hasServiceStyleTag(service:ExploreService,style:ExploreStyle){return service.tags.some(tag=>exact(tag)===exact(style.name));}
