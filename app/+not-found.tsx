import { Link, Stack } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.container}
      >
        <Text style={styles.title}>This screen does not exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen</Text>
        </Link>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#fff",
    marginBottom: 20,
  },
  link: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  linkText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#667eea",
  },
});
