import type {Extraction} from './faceFeatures/extractor';
import type {AdvisorResult} from './advisorRecommendation';
import {recommendFromLibrary} from './localEngine';
import type {MakeupEffect} from './effects';
import {DEFAULT_PREFERENCES,type LibraryPreferences} from './styleLibrary';
export function validFaceScanResult(value:AdvisorResult):boolean{
 const rows=value?.recommendations;
 return value?.source==='local'&&Array.isArray(rows)&&rows.length===3&&new Set(rows.map(r=>r?.styleKey)).size===3&&rows.every(r=>r&&typeof r.styleKey==='string'&&r.styleKey.length>0&&typeof r.title==='string'&&r.title.trim().length>0&&typeof r.shortDescription==='string'&&Array.isArray(r.makeupFocus)&&r.makeupFocus.length>0&&r.makeupFocus.every(t=>typeof t==='string'&&t.trim().length>0)&&Array.isArray(r.colorSuggestions)&&Array.isArray(r.occasionFit));
}
// No provider, transport, key or cloud consent in the Face Scan dependency graph.
export function recommendFaceScan(extraction:Extraction,preferences:LibraryPreferences=DEFAULT_PREFERENCES,effects:MakeupEffect[]=[],options:{fallbackForBlocked?:boolean}={}):AdvisorResult{
 // Preserve the existing provider fallback contract without admitting rejected measurements.
 // The scan flow never enables this compatibility option and still rejects blocked scans.
 const input=extraction.status==='blocked'&&options.fallbackForBlocked?{...extraction,status:'valid' as const,features:{},summary:{...extraction.summary,quality:{...extraction.summary.quality,frontal:false},features:{},featureSources:{}}}:extraction;
 const value=recommendFromLibrary(input,preferences,effects);
 if(!validFaceScanResult(value))throw {code:'E_RECOMMENDATIONS'};
 return value;
}

