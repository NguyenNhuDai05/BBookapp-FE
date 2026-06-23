
### UI Modification & Encoding Rules
1. **UTF-8 Encoding Awareness**: When making multiple line replacements in files containing Vietnamese or non-ASCII characters (like 	sx, json, md), ALWAYS use the multi_replace_file_content or eplace_file_content tool provided. NEVER use PowerShell regex (-replace with Get-Content/Set-Content) directly for text modifications unless absolutely necessary, as it often corrupts UTF-8 characters if not handled perfectly. If you must script it, use Node.js s.readFileSync with utf8.
2. **React Native Image Widths**: When using FlatList horizontal with full-width images (carousel), always explicitly set the item width (e.g., using Dimensions.get('window').width), do NOT rely on width: '100%' as the item wrapper inside FlatList might collapse.
3. **Empty Array Safety**: Always verify array items (like imageUrls) are not empty strings before rendering, especially after a database schema migration which might generate arrays with empty items (e.g. [""]).
