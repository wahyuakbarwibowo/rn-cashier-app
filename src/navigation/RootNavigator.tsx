import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DrawerNavigator from './DrawerNavigator';
import SaleDetailScreen from '../screens/SaleDetailScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import DigitalTransactionDetailScreen from '../screens/DigitalTransactionDetailScreen';
import CustomerPointsHistoryScreen from '../screens/CustomerPointsHistoryScreen';

const Stack = createStackNavigator();

const RootNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#FFF' },
      headerTintColor: '#111827',
      headerTitleStyle: { fontWeight: '600' },
      cardStyle: { backgroundColor: '#FFF' },
    }}
  >
    <Stack.Screen
      name="Main"
      component={DrawerNavigator}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="SaleDetail"
      component={SaleDetailScreen}
      options={{ title: 'Detail Transaksi' }}
    />
    <Stack.Screen
      name="ProductDetail"
      component={ProductDetailScreen}
      options={{ title: 'Detail Produk' }}
    />
    <Stack.Screen
      name="DigitalDetail"
      component={DigitalTransactionDetailScreen}
      options={{ title: 'Detail Transaksi Digital' }}
    />
    <Stack.Screen
      name="CustomerPointsHistory"
      component={CustomerPointsHistoryScreen}
      options={{ title: 'Riwayat Poin' }}
    />
  </Stack.Navigator>
);

export default RootNavigator;
