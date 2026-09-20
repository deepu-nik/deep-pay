import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
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
    back:{width:42,height:42,borderRadius:radius.md,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,alignItems:"center",justifyContent:"center"},
    search:{minHeight:50,borderRadius:radius.md,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,paddingHorizontal:spacing.lg,color:colors.text,fontSize:16,marginBottom:spacing.lg},
    card:{flexDirection:"row",alignItems:"center",gap:spacing.md,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:radius.lg,padding:spacing.md,marginBottom:spacing.sm},
    avatar:{width:44,height:44,borderRadius:22,backgroundColor:colors.iconBackground,alignItems:"center",justifyContent:"center"},muted:{color:colors.textMuted},
    modal:{flex:1,justifyContent:"flex-end",backgroundColor:"rgba(0,0,0,0.35)"},sheet:{backgroundColor:colors.surface,borderTopLeftRadius:radius.xl,borderTopRightRadius:radius.xl,padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},input:{minHeight:52,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,paddingHorizontal:spacing.lg,color:colors.text,fontSize:16,backgroundColor:colors.background}
  });
  return <SafeAreaView style={styles.safe} edges={["top"]}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.back} accessibilityLabel="Go back"><Ionicons name="arrow-back" size={21} color={colors.text}/></Pressable><View style={{flex:1}}><AppText variant="h2">Friends</AppText><AppText variant="caption" style={styles.muted}>{friends.length} {friends.length===1?"friend":"friends"}</AppText></View><Pressable onPress={()=>setVisible(true)} style={styles.back} accessibilityLabel="Add friend"><Ionicons name="person-add-outline" size={21} color={colors.primary}/></Pressable></View>
    <TextInput value={query} onChangeText={setQuery} placeholder="Search friends" placeholderTextColor={colors.textMuted} style={styles.search} autoCapitalize="none"/>
    {loading?<LoadingState message="Loading friends…"/>:filtered.length?filtered.map(friend=><View key={friend.id} style={styles.card}><View style={styles.avatar}><AppText variant="bodyMedium">{friend.name.slice(0,1).toUpperCase()}</AppText></View><View style={{flex:1}}><AppText variant="bodyMedium">{friend.name}</AppText><AppText variant="caption" style={styles.muted}>Friend</AppText></View><Ionicons name="chevron-forward" size={19} color={colors.textMuted}/></View>):<EmptyState icon="search-outline" title="No friends found" message="Try another name or add a new friend."/>}
  </ScrollView>
  <Modal visible={visible} transparent animationType="slide" onRequestClose={()=>setVisible(false)}><View style={styles.modal}><View style={styles.sheet}><View style={styles.header}><AppText variant="h2">Add friend</AppText><Pressable onPress={()=>setVisible(false)}><Ionicons name="close" size={24} color={colors.text}/></Pressable></View><TextInput value={name} onChangeText={setName} placeholder="Friend's name" placeholderTextColor={colors.textMuted} style={styles.input} autoFocus/><PrimaryButton title="Add friend" onPress={save} disabled={!name.trim()}/></View></View></Modal>
  </SafeAreaView>;
}
