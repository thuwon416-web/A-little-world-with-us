import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'

import { useLocation } from '@/hooks/useLocation'

const DEFAULT_REGION = {
  latitude: 13.7563,
  longitude: 100.5018,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
}

export default function LocationScreen() {
  const {
    currentLocation,
    partnerLocation,
    distanceKm,
    isSharing,
    loading,
    error,
    lastUpdated,
    toggleSharing,
  } = useLocation()

  const region = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : DEFAULT_REGION

  const handleToggle = async () => {
    await toggleSharing(!isSharing)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location</Text>

      <View style={[styles.banner, isSharing ? styles.bannerSharing : styles.bannerPrivate]}>
        <Text style={styles.bannerText}>{isSharing ? 'Sharing location' : 'Location private'}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation={isSharing}
        showsMyLocationButton
      >
        {currentLocation ? (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="You"
            pinColor="#ff6b81"
          />
        ) : null}

        {partnerLocation ? (
          <Marker
            coordinate={{
              latitude: partnerLocation.latitude,
              longitude: partnerLocation.longitude,
            }}
            title="Partner"
            pinColor="#b88ae5"
          />
        ) : null}
      </MapView>

      <View style={styles.card}>
        <Text style={styles.label}>Status</Text>
        <Text style={styles.value}>{isSharing ? 'Live sharing active' : 'Opt-in only'}</Text>

        <Text style={styles.label}>Last updated</Text>
        <Text style={styles.value}>
          {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Waiting for GPS'}
        </Text>

        {distanceKm !== null ? (
          <>
            <Text style={styles.label}>Distance</Text>
            <Text style={styles.value}>{distanceKm.toFixed(1)} km away</Text>
          </>
        ) : null}

        <TouchableOpacity
          style={[styles.button, isSharing ? styles.buttonStop : styles.buttonShare]}
          onPress={() => void handleToggle()}
        >
          <Text style={styles.buttonText}>{isSharing ? 'Stop sharing' : 'Share my location'}</Text>
        </TouchableOpacity>

        {loading ? <Text style={styles.meta}>Loading location...</Text> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f12',
    paddingTop: 72,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    color: '#f3f0f5',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  banner: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  bannerSharing: {
    backgroundColor: '#1f3b2f',
  },
  bannerPrivate: {
    backgroundColor: '#2d2d36',
  },
  bannerText: {
    color: '#f3f0f5',
    fontWeight: '600',
    fontSize: 13,
  },
  error: {
    color: '#ffb0bd',
    fontSize: 12,
    marginBottom: 12,
  },
  map: {
    flex: 1,
    borderRadius: 18,
    marginBottom: 18,
    minHeight: 260,
  },
  card: {
    backgroundColor: '#171b22',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2a2d35',
    padding: 18,
  },
  label: {
    color: '#9aa0a8',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 6,
  },
  value: {
    color: '#f3f0f5',
    fontSize: 15,
    fontWeight: '600',
  },
  button: {
    marginTop: 18,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonShare: {
    backgroundColor: '#b88ae5',
  },
  buttonStop: {
    backgroundColor: '#ff6b81',
  },
  buttonText: {
    color: '#f5f3f6',
    fontWeight: '700',
    fontSize: 15,
  },
  meta: {
    color: '#c4c4ce',
    marginTop: 12,
    fontSize: 12,
  },
})
