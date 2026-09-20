import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { LoadingState } from "@/src/components/common/LoadingState";
import { PrimaryButton } from "@/src/components/common/PrimaryButton";
import { useGroups } from "@/src/hooks/useGroups";
import { useFriends } from "@/src/hooks/useFriends";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

export default function GroupDetailScreen() {
  const router=useRouter();
  const {id}=useLocalSearchParams<{id:string}>();
  const {colors}=useTheme();
  const {groups, loading, updateGroup, deleteGroup}=useGroups();
  const {friends, refresh: refreshFriends}=useFriends();
  const [editorVisible,setEditorVisible]=useState(false);
  const [name,setName]=useState("");
  const [selected,setSelected]=useState<string[]>([]);

  const group=groups.find(item=>item.id===id);

  useEffect(()=>{ refreshFriends(); },[refreshFriends]);

  const styles=StyleSheet.create({
    safe:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl},
    header:{flexDirection:"row",alignItems:"center",gap:spacing.md,marginBottom:spacing.xl},
    headerActions:{marginLeft:"auto",flexDirection:"row",gap:spacing.sm},
    iconButton:{width:42,height:42,borderRadius:radius.md,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,alignItems:"center",justifyContent:"center"},
    hero:{backgroundColor:colors.surface,borderRadius:radius.xl,borderWidth:1,borderColor:colors.border,padding:spacing.xl,marginBottom:spacing.xl},
    icon:{width:56,height:56,borderRadius:28,backgroundColor:colors.iconBackground,alignItems:"center",justifyContent:"center",marginBottom:spacing.md},
    member:{flexDirection:"row",alignItems:"center",paddingVertical:spacing.md,borderBottomWidth:1,borderBottomColor:colors.border},
    avatar:{width:38,height:38,borderRadius:19,backgroundColor:colors.iconBackground,alignItems:"center",justifyContent:"center",marginRight:spacing.md},
    muted:{color:colors.textMuted},modal:{flex:1,justifyContent:"flex-end",backgroundColor:"rgba(0,0,0,0.35)"},
    sheet:{backgroundColor:colors.surface,borderTopLeftRadius:radius.xl,borderTopRightRadius:radius.xl,padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},
    input:{minHeight:52,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,paddingHorizontal:spacing.lg,color:colors.text,fontSize:16,backgroundColor:colors.background},
    chips:{flexDirection:"row",flexWrap:"wrap",gap:spacing.sm},chip:{paddingHorizontal:spacing.md,paddingVertical:spacing.sm,borderRadius:radius.pill,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background},
    selectedChip:{borderColor:colors.primary,backgroundColor:colors.iconBackground},
  });

  if (loading) return <SafeAreaView style={styles.safe}><LoadingState message="Loading group…" /></SafeAreaView>;
  if(!group) return <SafeAreaView style={styles.safe}><View style={styles.content}><Pressable onPress={()=>router.back()} style={styles.iconButton}><Ionicons name="arrow-back" size={21} color={colors.text}/></Pressable><AppText variant="h2" style={{marginTop:spacing.xl}}>Group not found</AppText></View></SafeAreaView>;

  const names=group.memberIds.map(memberId=>memberId==="You"?"You":friends.find(f=>f.id===memberId)?.name??memberId);

  const openEdit=async()=>{
    await refreshFriends();
    setName(group.name);
    setSelected(group.memberIds.filter(memberId=>memberId!=="You"));
    setEditorVisible(true);
  };

  const toggle=(friendId:string)=>setSelected(current=>current.includes(friendId)?current.filter(id=>id!==friendId):[...current,friendId]);

  const save=async()=>{
    if(!name.trim()) return;
    await updateGroup(group.id,{name:name.trim(),memberIds:["You",...selected]});
    setEditorVisible(false);
  };

  const confirmDelete=()=>{
    Alert.alert("Delete group?",`This will remove “${group.name}” from your groups.`,[
      {text:"Cancel",style:"cancel"},
      {text:"Delete",style:"destructive",onPress:async()=>{await deleteGroup(group.id);router.replace("/(tabs)/groups");}},
    ]);
  };

  return <SafeAreaView style={styles.safe} edges={["top"]}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={()=>router.back()} style={styles.iconButton} accessibilityLabel="Go back"><Ionicons name="arrow-back" size={21} color={colors.text}/></Pressable>
        <AppText variant="h2" numberOfLines={1} style={{flex:1}}>{group.name}</AppText>
        <View style={styles.headerActions}>
          <Pressable onPress={openEdit} style={styles.iconButton} accessibilityLabel="Edit group"><Ionicons name="create-outline" size={20} color={colors.primary}/></Pressable>
          <Pressable onPress={confirmDelete} style={styles.iconButton} accessibilityLabel="Delete group"><Ionicons name="trash-outline" size={20} color={colors.danger}/></Pressable>
        </View>
      </View>
      <View style={styles.hero}><View style={styles.icon}><Ionicons name="people-outline" size={27} color={colors.primary}/></View><AppText variant="title">{group.name}</AppText><AppText variant="body" style={styles.muted}>{names.length} members</AppText></View>
      <AppText variant="h2" style={{marginBottom:spacing.sm}}>Members</AppText>
      <View>{names.map((memberName,index)=><View key={memberName+"-"+index} style={styles.member}><View style={styles.avatar}><AppText variant="caption">{memberName.slice(0,1).toUpperCase()}</AppText></View><AppText variant="bodyMedium">{memberName}</AppText></View>)}</View>
      <View style={{marginTop:spacing.xl,padding:spacing.lg,backgroundColor:colors.surfaceMuted,borderRadius:radius.lg}}><AppText variant="bodyMedium">Group expenses</AppText><AppText variant="caption" style={styles.muted}>Expenses linked to this group will appear here. Group expense history and balances come next.</AppText></View>
    </ScrollView>
    <Modal visible={editorVisible} transparent animationType="slide" onRequestClose={()=>setEditorVisible(false)}>
      <View style={styles.modal}><View style={styles.sheet}>
        <View style={styles.header}><AppText variant="h2">Edit group</AppText><Pressable onPress={()=>setEditorVisible(false)}><Ionicons name="close" size={24} color={colors.text}/></Pressable></View>
        <TextInput value={name} onChangeText={setName} placeholder="Group name" placeholderTextColor={colors.textMuted} style={styles.input} autoFocus/>
        <AppText variant="bodyMedium">Members</AppText>
        <View style={styles.chips}>{friends.map(friend=><Pressable key={friend.id} onPress={()=>toggle(friend.id)} style={[styles.chip,selected.includes(friend.id)&&styles.selectedChip]}><AppText variant="caption" style={selected.includes(friend.id)?{color:colors.primary}:undefined}>{friend.name}</AppText></Pressable>)}</View>
        <PrimaryButton title="Save changes" onPress={save} disabled={!name.trim()}/>
      </View></View>
    </Modal>
  </SafeAreaView>;
}
