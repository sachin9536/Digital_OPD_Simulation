import "react-native-reanimated"; // Keep this at the top
import React from "react";
import { SafeAreaView } from "react-native";
import ChatScreen from "../components/ChatScreen";

export default function Index() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ChatScreen sessionId={1} />
    </SafeAreaView>
  );
}