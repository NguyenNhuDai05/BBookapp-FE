# So sánh metadata chính xác — giữ engine 12 nguyên trạng

Không thay bất kỳ metadata engine cũ. Đây là before/after của v1.1 scoring so với v1.2 presentation, không phải một diff đã áp dụng vào engine. Simulation cũng dùng metadata v1.1 cho 12 key cũ.

| Key | Field | Engine v1.1 | Catalog v1.2 | Tác động ranking nếu thay | Ghi chú |
|---|---|---|---|---|---|
| soft-korean | occasions | ["daily","school","date"] | ["daily","date","school"] | Không | Chỉ thứ tự; includes() không đổi điểm |
| soft-korean | tags | ["korean","soft","pink","gradient-lips"] | ["natural","soft","korean","dewy","fresh"] | Không | Không score; ảnh hưởng search metadata |
| soft-korean | colorPalette | ["Hồng phấn","Đào nhạt","Nâu sữa"] | ["soft pink","peach","light brown","coral"] | Không | Chỉ hiển thị |
| douyin | intensity | "medium" | "bold" | Có, chưa áp dụng | Đổi bonus 0.08 nếu thay metadata engine |
| douyin | occasions | ["date","party","photoshoot"] | ["party","photoshoot","date"] | Không | Chỉ thứ tự; includes() không đổi điểm |
| douyin | tags | ["douyin","shimmer","defined-lashes","glossy-lips"] | ["douyin","glamorous","sparkling","sharp","trendy"] | Không | Không score; ảnh hưởng search metadata |
| douyin | colorPalette | ["Hồng đào","Nâu hồng","Champagne"] | ["rose pink","champagne","brown","red"] | Không | Chỉ hiển thị |
| clean-girl | occasions | ["daily","work","date"] | ["daily","work","school"] | Có, chưa áp dụng | Membership đổi bonus 0.12 |
| clean-girl | tags | ["minimal","dewy","cream-blush","tinted-balm"] | ["clean-girl","minimalist","natural","chic","polished"] | Không | Không score; ảnh hưởng search metadata |
| clean-girl | colorPalette | ["Hồng nude","Đào trong","Nâu nhạt"] | ["nude","warm beige","bronze","soft pink"] | Không | Chỉ hiển thị |
| natural | occasions | ["daily","work","school"] | ["daily","school","work"] | Không | Chỉ thứ tự; includes() không đổi điểm |
| natural | tags | ["natural","satin","neutral","everyday"] | ["natural","everyday","fresh","simple","lightweight"] | Không | Không score; ảnh hưởng search metadata |
| natural | colorPalette | ["Nâu nhạt","Hồng đất nhẹ","Be hồng"] | ["light pink","nude peach","soft beige"] | Không | Chỉ hiển thị |
| peach | intensity | "light" | "medium" | Có, chưa áp dụng | Đổi bonus 0.08 nếu thay metadata engine |
| peach | occasions | ["daily","date","photoshoot"] | ["date","daily","photoshoot"] | Không | Chỉ thứ tự; includes() không đổi điểm |
| peach | tags | ["peach","monochromatic","fresh","soft"] | ["peach","sweet","vibrant","youthful","fruity"] | Không | Không score; ảnh hưởng search metadata |
| peach | colorPalette | ["Đào nhạt","Cam hồng","Nâu đào"] | ["peach","coral","warm pink","apricot"] | Không | Chỉ hiển thị |
| strawberry | intensity | "light" | "medium" | Có, chưa áp dụng | Đổi bonus 0.08 nếu thay metadata engine |
| strawberry | occasions | ["daily","date","photoshoot"] | ["date","photoshoot","daily"] | Không | Chỉ thứ tự; includes() không đổi điểm |
| strawberry | tags | ["strawberry","rosy-blush","gloss","fresh"] | ["strawberry","pink-red","cute","fresh","playful"] | Không | Không score; ảnh hưởng search metadata |
| strawberry | colorPalette | ["Hồng dâu","Đỏ hồng","Nâu mềm"] | ["strawberry red","pink","berry","soft brown"] | Không | Chỉ hiển thị |
| latte | occasions | ["work","date","party","photoshoot"] | ["work","date","party"] | Có, chưa áp dụng | Membership đổi bonus 0.12 |
| latte | tags | ["latte","brown","bronze","monochromatic"] | ["latte","warm brown","chic","autumnal","sophisticated"] | Không | Không score; ảnh hưởng search metadata |
| latte | colorPalette | ["Nâu sữa","Caramel","Đồng nhạt"] | ["caramel","latte brown","warm beige","bronze"] | Không | Chỉ hiển thị |
| soft-glam | intensity | "medium" | "bold" | Có, chưa áp dụng | Đổi bonus 0.08 nếu thay metadata engine |
| soft-glam | occasions | ["date","party","photoshoot","wedding"] | ["party","date","photoshoot"] | Có, chưa áp dụng | Membership đổi bonus 0.12 |
| soft-glam | tags | ["soft-glam","blended","satin","neutral"] | ["soft-glam","glamorous","romantic","polished","evening"] | Không | Không score; ảnh hưởng search metadata |
| soft-glam | colorPalette | ["Nâu trung tính","Hồng đất","Champagne dịu"] | ["rose gold","warm brown","taupe","mauve"] | Không | Chỉ hiển thị |
| thai-glam | occasions | ["party","photoshoot","wedding"] | ["party","photoshoot","date"] | Có, chưa áp dụng | Membership đổi bonus 0.12 |
| thai-glam | tags | ["thai-glam","bronze","defined-eyes","nude-lips"] | ["thai-look","sharp","bold","bronzed","striking"] | Không | Không score; ảnh hưởng search metadata |
| thai-glam | colorPalette | ["Nâu đồng","Be nâu","Hồng nâu"] | ["bronze","terracotta","warm nude","burnt orange"] | Không | Chỉ hiển thị |
| smokey-eyes | tags | ["smokey","dark-eyes","blended","evening"] | ["smokey","dramatic","bold","mysterious","edgy"] | Không | Không score; ảnh hưởng search metadata |
| smokey-eyes | colorPalette | ["Nâu khói","Xám than","Hồng nude"] | ["charcoal black","dark brown","silver","nude"] | Không | Chỉ hiển thị |
| bridal-soft-glam | tags | ["bridal","soft-glam","rose","longwear"] | ["bridal","romantic","elegant","glowy","timeless"] | Không | Không score; ảnh hưởng search metadata |
| bridal-soft-glam | colorPalette | ["Hồng nâu","Hồng đất","Champagne mịn"] | ["champagne","rose pink","soft peach","pearl white"] | Không | Chỉ hiển thị |
| classic-glam | tags | ["classic","red-lips","winged-liner","glam"] | ["classic","hollywood","red-lips","vintage","timeless"] | Không | Không score; ảnh hưởng search metadata |
| classic-glam | colorPalette | ["Đỏ cổ điển","Be sáng","Nâu trung tính"] | ["classic red","black","ivory","gold"] | Không | Chỉ hiển thị |
