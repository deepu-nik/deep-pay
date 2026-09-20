import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { useGroups } from "@/src/hooks/useGroups";
import { useFriends } from "@/src/hooks/useFriends";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

export default function GroupDetailScreen() {
  const router=useRouter(); const {id}=useLocalSearchParams<{id:string}>(); const {colors}=useTheme(); const {groups}=useGroups(); const {friends}=useFriends();
  const group=groups.find(item=>item.id===id);
  const names=(group?.memberIds??[]).map(memberId=>memberId==="You"?"You":friends.find(f=>f.id===memberId)?.name??memberId);
  const styles=StyleSheet.create({
    safe:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl},header:{flexDirection:"row",alignItems:"center",gap:spacing.md,marginBottom:spacing.xl},back:{width:42,height:42,borderRadius:radius.md,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,alignItems:"center",justifyContent:"center"},
    hero:{backgroundColor:colors.surface,borderRadius:radius.xl,borderWidth:1,borderColor:colors.border,padding:spacing.xl,marginBottom:spacing.xl},icon:{width:56,height:56,borderRadius:28,backgroundColor:colors.iconBackground,alignItems:"center",justifyContent:"center",marginBottom:spacing.md},
    member:{flexDirection:"row",alignItems:"center",paddingVertical:spacing.md,borderBottomWidth:1,borderBottomColor:colors.border},avatar:{width:38,height:38,borderRadius:19,backgroundColor:colors.iconBackground,alignItems:"center",justifyContent:"center",marginRight:spacing.md},muted:{color:colors.textMuted}
  });
  if(!group) return <SafeAreaView style={styles.safe}><View style={styles.content}><Pressable onPress={()=>router.back()} style={styles.back}><Ionicons name="arrow-back" size={21} color={colors.text}/></Pressable><AppText variant="h2" style={{marginTop:spacing.xl}}>Group not found</AppText></View></SafeAreaView>;
  return <SafeAreaView style={styles.safe} edges={["top"]}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.back} accessibilityLabel="Go back"><Ionicons name="arrow-back" size={21} color={colors.text}/></Pressable><AppText variant="h2">{group.name}</AppText></View>
    <View style={styles.hero}><View style={styles.icon}><Ionicons name="people-outline" size={27} color={colors.primary}/></View><AppText variant="title">{group.name}</AppText><AppText variant="body" style={styles.muted}>{names.length} members</AppText></View>
    <AppText variant="h2" style={{marginBottom:spacing.sm}}>Members</AppText>
    <View>{names.map((name,index)=><View key={name+"-"+index} style={styles.member}><View style={styles.avatar}><AppText variant="caption">{name.slice(0,1).toUpperCase()}</AppText></View><AppText variant="bodyMedium">{name}</AppText></View>)}</View>
    <View style={{marginTop:spacing.xl,padding:spacing.lg,backgroundColor:colors.surfaceMuted,borderRadius:radius.lg}}><AppText variant="bodyMedium">Group expenses</AppText><AppText variant="caption" style={styles.muted}>Expenses linked to this group will appear here. The next step is group expense history and balances.</AppText></View>
  </ScrollView></SafeAreaView>;
}
