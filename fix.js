const fs = require('fs');
let file = fs.readFileSync('D:/EXE/bbeauty-app/app/(mua)/profile.tsx', 'utf-8');
let lines = file.split('\n');

const content = `  }, [params.tab]);

  const displayAvatar = profile?.avatarUrl || '';
  const displayName = profile?.brandName || user?.name || 'Nguyễn Lan Anh';
  const displayBio = profile?.bio || 'MAKEUP ARTIST • MASTER EDUCATOR';
  
  // Use real portfolio. If empty, it's an empty array.
  const displayPortfolio = portfolio || [];

  const handleOpenSettings = () => {
    router.push('/(mua)/settings' as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#FFF5F7', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ width: 24 }} /> {/* Placeholder for back arrow if needed */}
        <Text style={styles.headerTitle}>Hồ sơ chuyên gia</Text>
        <TouchableOpacity onPress={handleOpenSettings} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Menu size={24} color="#C42A64" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Instagram-inspired Header */}
        <View style={styles.igHeaderContainer}>
          <View style={styles.igTopRow}>
            {/* Avatar on the left */}
            <View style={styles.igAvatarWrapper}>
              {displayAvatar ? (
                <Image source={{ uri: displayAvatar }} style={styles.igAvatar} />
              ) : (
                <View style={[styles.igAvatar, { backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' }]}>
                  <User size={40} color="#A855F7" />
                </View>
              )}
              {/* Optional verification or story ring can go here */}
            </View>

            {/* Stats on the right */}
            <View style={styles.igStatsContainer}>`;

// We find the line that has "    if (params.tab) {" and replace from 3 lines after that.
const targetLineIndex = lines.findIndex(l => l.includes('if (params.tab) {'));
if (targetLineIndex !== -1) {
  // It's line targetLineIndex. targetLineIndex + 1 is setActiveTab, targetLineIndex + 2 is }
  // We want to replace lines[targetLineIndex + 3] to lines[targetLineIndex + 4] which currently has } and <View style={styles.igStatItem}>
  lines.splice(targetLineIndex + 3, 2, content);
}

fs.writeFileSync('D:/EXE/bbeauty-app/app/(mua)/profile.tsx', lines.join('\n'));
