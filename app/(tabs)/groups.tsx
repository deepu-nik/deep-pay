import { useCallback, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/src/components/common/AppText";
import { BottomTabBar } from "@/src/components/navigation/BottomTabBar";
import { CreateActionSheet } from "@/src/components/navigation/CreateActionSheet";
import { EmptyState } from "@/src/components/common/EmptyState";
import { LoadingState } from "@/src/components/common/LoadingState";
import { PrimaryButton } from "@/src/components/common/PrimaryButton";
import { useGroups } from "@/src/hooks/useGroups";
import { useFriends } from "@/src/hooks/useFriends";
import type { Group } from "@/src/types/domain";
import { useTheme } from "@/src/theme";
import { radius, spacing } from "@/src/theme/tokens";

export default function GroupsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { groups, loading, refresh: refreshGroups, createGroup, updateGroup } = useGroups();
  const { friends, loading: friendsLoading, refresh: refreshFriends } = useFriends();
  const [editorVisible, setEditorVisible] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useFocusEffect(useCallback(() => {
    refreshGroups();
    refreshFriends();
  }, [refreshGroups, refreshFriends]));

  const styles = StyleSheet.create({
    safe:{flex:1,backgroundColor:colors.background}, content:{padding:spacing.lg,paddingBottom:110},
    header:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:spacing.xl},
    headerActions:{flexDirection:"row",gap:spacing.sm}, iconButton:{width:44,height:44,borderRadius:radius.md,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,alignItems:"center",justifyContent:"center"},
    card:{backgroundColor:colors.surface,borderRadius:radius.lg,borderWidth:1,borderColor:colors.border,padding:spacing.lg,marginBottom:spacing.md},
    row:{flexDirection:"row",alignItems:"center",gap:spacing.md}, groupIcon:{width:48,height:48,borderRadius:24,backgroundColor:colors.iconBackground,alignItems:"center",justifyContent:"center"},
    muted:{color:colors.textMuted}, modal:{flex:1,justifyContent:"flex-end",backgroundColor:"rgba(0,0,0,0.35)"},
    sheet:{backgroundColor:colors.surface,borderTopLeftRadius:radius.xl,borderTopRightRadius:radius.xl,padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},
    input:{minHeight:52,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,paddingHorizontal:spacing.lg,color:colors.text,fontSize:16,backgroundColor:colors.background},
    chips:{flexDirection:"row",flexWrap:"wrap",gap:spacing.sm}, chip:{paddingHorizontal:spacing.md,paddingVertical:spacing.sm,borderRadius:radius.pill,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background},
    selectedChip:{borderColor:colors.primary,backgroundColor:colors.iconBackground},
  });

  const openCreate = async () => {
    await refreshFriends();
    setEditingGroup(null);
    setName("");
    setSelected([]);
    setEditorVisible(true);
  };

  const openEdit = async (group: Group) => {
    await refreshFriends();
    setEditingGroup(group);
    setName(group.name);
    setSelected(group.memberIds.filter((id) => id !== "You"));
    setEditorVisible(true);
  };

  const toggle = (id: string) => setSelected((current) =>
    current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
  );

  const save = async () => {
    if (!name.trim()) return;
    const input = { name: name.trim(), memberIds: ["You", ...selected] };
    if (editingGroup) {
      await updateGroup(editingGroup.id, input);
    } else {
      await createGroup(input);
    }
    setEditorVisible(false);
    setEditingGroup(null);
    setName("");
    setSelected([]);
  };

  const goTo=(tab:"home"|"groups"|"activity"|"profile")=>{
    if(tab==="groups") return;
    router.push(tab==="home" ? "/(tabs)" : `/(tabs)/${tab}` as any);
  };
  const memberCount=(ids:string[])=>ids.length===1 ? "1 member" : `${ids.length} members`;

  return <SafeAreaView style={styles.safe} edges={["top"]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View><AppText variant="title">Groups</AppText><AppText variant="body" style={styles.muted}>Shared expenses, kept together.</AppText></View>
        <View style={styles.headerActions}>
          <Pressable onPress={()=>router.push("/friends")} accessibilityLabel="Open friends" style={styles.iconButton}><Ionicons name="people-outline" size={21} color={colors.primary}/></Pressable>
          <Pressable onPress={openCreate} accessibilityLabel="Create group" style={styles.iconButton}><Ionicons name="add" size={24} color={colors.primary}/></Pressable>
        </View>
      </View>
      {loading ? <LoadingState message="Loading groups…" /> : groups.length ? groups.map(group =>
        <Pressable key={group.id} onPress={()=>router.push(`/groups/${group.id}`)} style={styles.card}>
          <View style={styles.row}>
            <View style={styles.groupIcon}><Ionicons name="people-outline" size={23} color={colors.primary}/></View>
            <View style={{flex:1}}><AppText variant="bodyMedium">{group.name}</AppText><AppText variant="caption" style={styles.muted}>{memberCount(group.memberIds)}</AppText></View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted}/>
          </View>
        </Pressable>
      ) : <EmptyState icon="people-outline" title="No groups yet" message="Create a group for trips, roommates, clubs or projects." />}
    </ScrollView>
    <BottomTabBar activeTab="groups" onTabPress={goTo} onAddPress={()=>setSheetVisible(true)}/>
    <CreateActionSheet visible={sheetVisible} onClose={()=>setSheetVisible(false)}/>
    <Modal visible={editorVisible} transparent animationType="slide" onRequestClose={()=>setEditorVisible(false)}>
      <View style={styles.modal}><View style={styles.sheet}>
        <View style={styles.header}><AppText variant="h2">{editingGroup ? "Edit group" : "Create group"}</AppText><Pressable onPress={()=>setEditorVisible(false)}><Ionicons name="close" size={24} color={colors.text}/></Pressable></View>
        <TextInput value={name} onChangeText={setName} placeholder="e.g. Goa Trip" placeholderTextColor={colors.textMuted} style={styles.input} autoFocus/>
        <AppText variant="bodyMedium">Members</AppText>
        {friendsLoading ? <LoadingState message="Loading friends…" /> : <View style={styles.chips}>
          {friends.map(friend => <Pressable key={friend.id} onPress={()=>toggle(friend.id)} style={[styles.chip,selected.includes(friend.id)&&styles.selectedChip]}>
            <AppText variant="caption" style={selected.includes(friend.id)?{color:colors.primary}:undefined}>{friend.name}</AppText>
          </Pressable>)}
        </View>}
        <PrimaryButton title={editingGroup ? "Save changes" : "Create group"} onPress={save} disabled={!name.trim()}/>
      </View></View>
    </Modal>
  </SafeAreaView>;
}
