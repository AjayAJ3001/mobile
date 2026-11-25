import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, loadSession } from './src/api';
import { AuthContext } from './src/auth';
import { APP_NAME } from './src/brand';
import { DashIcon, DocIcon, LoadIcon, TruckIcon, UploadIcon, UserIcon } from './src/icons';
import DashboardScreen from './src/screens/DashboardScreen';
import LoadScreen from './src/screens/LoadScreen';
import LoadViewScreen from './src/screens/LoadViewScreen';
import ClosedLoadScreen from './src/screens/ClosedLoadScreen';
import ClosedLoadViewScreen from './src/screens/ClosedLoadViewScreen';
import LoadsScreen from './src/screens/LoadsScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ReceiptDetailScreen from './src/screens/ReceiptDetailScreen';
import ReceiptsScreen from './src/screens/ReceiptsScreen';
import AuditScreen from './src/screens/AuditScreen';
import ManagersScreen from './src/screens/ManagersScreen';
import PartiesScreen from './src/screens/PartiesScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import RrMasterScreen from './src/screens/RrMasterScreen';
import UploadedPdfsScreen from './src/screens/UploadedPdfsScreen';
import ReportViewScreen from './src/screens/ReportViewScreen';
import RrCloseScreen from './src/screens/RrCloseScreen';
import RrCloseViewScreen from './src/screens/RrCloseViewScreen';
import TruckDetailScreen from './src/screens/TruckDetailScreen';
import TruckListScreen from './src/screens/TruckListScreen';
import TrucksScreen from './src/screens/TrucksScreen';
import UploadScreen from './src/screens/UploadScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();

const TABS = [
  { name: 'Dashboard', label: 'Dashboard', Icon: DashIcon },
  { name: 'Upload', label: 'Upload', Icon: UploadIcon },
  { name: 'Trucks', label: 'Truck', Icon: TruckIcon },
  { name: 'Loads', label: 'Load', Icon: LoadIcon },
  { name: 'Receipts', label: 'RR', Icon: DocIcon },
  { name: 'Profile', label: 'Profile', Icon: UserIcon },
];

function BottomNav({ current, onPress }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {TABS.map((tab) => {
        const active = current === tab.name;
        const color = active ? colors.gold : colors.tabIdle;
        const Icon = tab.Icon;
        return (
          <Pressable key={tab.name} style={styles.tab} onPress={() => onPress(tab.name)}>
            <Icon color={color} />
            <Text style={[styles.tabLabel, active && styles.tabOn]} numberOfLines={1}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [routeName, setRouteName] = useState('Login');
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    loadSession()
      .then(async (session) => {
        if (!session?.token) return;
        const data = await api('/api/auth/me');
        setUser(data.user);
      })
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  function syncRoute() {
    setRouteName(navigationRef.getCurrentRoute()?.name || '');
  }

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  const showTabs = TABS.some((tab) => tab.name === routeName);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <SafeAreaProvider>
        <View style={styles.shell}>
          <View style={styles.stack}>
          <NavigationContainer ref={navigationRef} onReady={syncRoute} onStateChange={syncRoute}>
            <StatusBar style="light" />
            <Stack.Navigator
              screenOptions={{
                headerStyle: { backgroundColor: colors.greenDeep },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: { fontWeight: '600' },
                contentStyle: { backgroundColor: colors.paper },
              }}
            >
              {user ? (
                <>
                  <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: APP_NAME }} />
                  <Stack.Screen name="Upload" component={UploadScreen} options={{ title: 'RR Upload' }} />
                  <Stack.Screen name="Receipts" component={ReceiptsScreen} options={{ title: 'RR register' }} />
                  <Stack.Screen name="Trucks" component={TrucksScreen} options={{ title: 'Truck entry' }} />
                  <Stack.Screen name="Loads" component={LoadsScreen} options={{ title: 'Load entry' }} />
                  <Stack.Screen name="ClosedLoad" component={ClosedLoadScreen} options={({ route }) => ({ title: `RR ${route.params?.rrNo || ''}` })} />
                  <Stack.Screen name="ClosedLoadView" component={ClosedLoadViewScreen} options={{ title: 'View' }} />
                  <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
                  {user.role === 'owner' ? (
                    <>
                      <Stack.Screen name="Parties" component={PartiesScreen} options={{ title: 'Parties and units' }} />
                      <Stack.Screen name="RrMaster" component={RrMasterScreen} options={{ title: 'RR Master' }} />
                      <Stack.Screen name="UploadedPdfs" component={UploadedPdfsScreen} options={{ title: 'Uploaded PDFs' }} />
                      <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: 'Report' }} />
                      <Stack.Screen name="ReportView" component={ReportViewScreen} options={({ route }) => ({ title: route.params?.report?.label || 'Report' })} />
                      <Stack.Screen name="ReportPreview" component={ReportViewScreen} options={{ title: 'View' }} />
                      <Stack.Screen name="Managers" component={ManagersScreen} options={{ title: 'Managers' }} />
                      <Stack.Screen name="Audit" component={AuditScreen} options={{ title: 'Audit log' }} />
                    </>
                  ) : null}
                  <Stack.Screen name="Load" component={LoadScreen} options={({ route }) => ({ title: route.params.truck.truckNo })} />
                  <Stack.Screen name="LoadView" component={LoadViewScreen} options={{ title: 'View' }} />
                  <Stack.Screen name="TruckList" component={TruckListScreen} options={{ title: 'Truck details' }} />
                  <Stack.Screen name="Truck" component={TruckDetailScreen} options={({ route }) => ({ title: route.params.truck.truckNo })} />
                  <Stack.Screen name="Receipt" component={ReceiptDetailScreen} options={{ title: 'RR' }} />
                  <Stack.Screen name="RrClose" component={RrCloseScreen} options={{ title: 'RR closed' }} />
                  <Stack.Screen name="RrCloseView" component={RrCloseViewScreen} options={{ title: 'View' }} />
                </>
              ) : (
                <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
              )}
            </Stack.Navigator>
          </NavigationContainer>
          </View>
          {user && showTabs ? <BottomNav current={routeName} onPress={(name) => navigationRef.navigate(name)} /> : null}
        </View>
      </SafeAreaProvider>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, justifyContent: 'center', backgroundColor: colors.paper },
  shell: { flex: 1, backgroundColor: colors.paper },
  stack: { flex: 1 },
  bar: { flexDirection: 'row', backgroundColor: colors.greenDeep, paddingTop: 8, borderTopWidth: 2, borderTopColor: colors.gold },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingHorizontal: 1 },
  tabLabel: { color: colors.tabIdle, fontSize: 9, fontWeight: '700' },
  tabOn: { color: colors.gold },
});
