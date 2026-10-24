import {containImage,imagePointToView} from '../imageTransform';

test('portrait is centered with horizontal letterboxing',()=>{expect(containImage({width:720,height:960},{width:400,height:400})).toEqual({scale:400/960,width:300,height:400,left:50,top:0});expect(imagePointToView({x:360,y:480},{width:720,height:960},{width:400,height:400})).toEqual({x:200,y:200});});
test('landscape is centered with vertical letterboxing and resizing',()=>{expect(containImage({width:1280,height:720},{width:320,height:400})).toEqual({scale:.25,width:320,height:180,left:0,top:110});expect(imagePointToView({x:1280,y:720},{width:1280,height:720},{width:320,height:400})).toEqual({x:320,y:290});});
test('normalized EXIF-rotated portrait uses output dimensions without rotating twice',()=>{expect(imagePointToView({x:100,y:300},{width:720,height:1280},{width:360,height:640})).toEqual({x:50,y:150});});
test('already rasterized EXIF mirror stays on the same side, no UI mirror',()=>{expect(imagePointToView({x:100,y:200},{width:720,height:960},{width:360,height:480})).toEqual({x:50,y:100});});
test('zero/unmeasured viewport and invalid dimensions have no transform',()=>{expect(containImage({width:720,height:960},{width:0,height:400})).toBeUndefined();expect(containImage({width:NaN,height:960},{width:400,height:400})).toBeUndefined();});
