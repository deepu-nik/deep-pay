import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { GlassPanel } from "@/src/components/common/GlassPanel";
import { LoadingState } from "@/src/components/common/LoadingState";
import { EmptyState } from "@/src/components/common/EmptyState";
import { PrimaryButton } from "@/src/components/common/PrimaryButton";
import { useFriends } from "@/src/hooks/useFriends";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

export default function FriendsScreen() {
  const router=useRouter(); const {colors}=useTheme(); const {friends,loading,addFriend}=useFriends();
  const [query,setQuery]=useState(""); const [visible,setVisible]=useState(false); const [name,setName]=useState("");
  const filtered=useMemo(()=>friends.filter(f=>f.name.toLowerCase().includes(query.trim().toLowerCase())),[friends,query]);
  const save=async()=>{if(!name.trim())return;await addFriend(name);setName("");setVisible(false);};
  const styles=StyleSheet.create({
    safe:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl},header:{flexDirection:"row",alignItems:"center",gap:spacing.md,marginBottom:spacing.xl},
    back:{width:42,height:42,borderRadius:radius.md,backgroundColor:colors.glassGradient[0],borderWidth:1,borderColor:colors.glassBorder,alignItems:"center",justifyContent:"center"},
    search:{minHeight:50,borderRadius:radius.md,borderWidth:1,borderColor:colors.glassBorder,backgroundColor:colors.glassGradient[0],paddingHorizontal:spacing.lg,color:colors.text,fontSize:16,marginBottom:spacing.lg},
    card:{flexDirection:"row",alignItems:"center",gap:spacing.md}, friendPanel:{borderRadius:radius.lg,marginBottom:spacing.sm},
    avatar:{width:44,height:44,borderRadius:22,backgroundColor:colors.iconBackground,alignItems:"center",justifyContent:"center"},muted:{color:colors.textMuted},
    modal:{flex:1,justifyContent:"flex-end",backgroundColor:"rgba(0,0,0,0.35)"},sheet:{borderTopLeftRadius:radius.xl,borderTopRightRadius:radius.xl,borderBottomLeftRadius:0,borderBottomRightRadius:0},sheetContent:{gap:spacing.lg,paddingBottom:spacing.xxl - spacing.lg},input:{minHeight:52,borderWidth:1,borderColor:colors.glassBorder,borderRadius:radius.md,paddingHorizontal:spacing.lg,color:colors.text,fontSize:16,backgroundColor:colors.glassGradient[0]}
  });
  return <SafeAreaView style={styles.safe} edges={["top"]}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.back} accessibilityLabel="Go back"><Ionicons name="arrow-back" size={21} color={colors.text}/></Pressable><View style={{flex:1}}><AppText variant="h2">Friends</AppText><AppText variant="caption" style={styles.muted}>{friends.length} {friends.length===1?"friend":"friends"}</AppText></View><Pressable onPress={()=>setVisible(true)} style={styles.back} accessibilityLabel="Add friend"><Ionicons name="person-add-outline" size={21} color={colors.primary}/></Pressable></View>
    <TextInput value={query} onChangeText={setQuery} placeholder="Search friends" placeholderTextColor={colors.textMuted} style={styles.search} autoCapitalize="none"/>
    {loading?<GlassPanel padding={spacing.xl}><LoadingState message="Loading friends…"/></GlassPanel>:filtered.length?filtered.map(friend=><GlassPanel key={friend.id} padding={spacing.md} style={styles.friendPanel}><View style={styles.card}><View style={styles.avatar}><AppText variant="bodyMedium">{friend.name.slice(0,1).toUpperCase()}</AppText></View><View style={{flex:1}}><AppText variant="bodyMedium">{friend.name}</AppText><AppText variant="caption" style={styles.muted}>Friend</AppText></View><Ionicons name="chevron-forward" size={19} color={colors.textMuted}/></View></GlassPanel>):<GlassPanel padding={spacing.xl}><EmptyState icon="search-outline" title="No friends found" message="Try another name or add a new friend."/></GlassPanel>}
  </ScrollView>
  <Modal visible={visible} transparent animationType="slide" onRequestClose={()=>setVisible(false)}><View style={styles.modal}><GlassPanel padding={spacing.lg} style={styles.sheet}><View style={styles.sheetContent}><View style={styles.header}><AppText variant="h2">Add friend</AppText><Pressable onPress={()=>setVisible(false)}><Ionicons name="close" size={24} color={colors.text}/></Pressable></View><TextInput value={name} onChangeText={setName} placeholder="Friend's name" placeholderTextColor={colors.textMuted} style={styles.input} autoFocus/><PrimaryButton title="Add friend" onPress={save} disabled={!name.trim()}/></View></GlassPanel></View></Modal>
  </SafeAreaView>;
}
