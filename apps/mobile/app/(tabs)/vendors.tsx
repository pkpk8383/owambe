import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  FlatList, Dimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { vendorsApi } from '../../src/services/api';
import { Card, Badge, Spinner, EmptyState, formatNGN } from '../../src/components/ui';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, VENDOR_EMOJIS, VENDOR_LABELS } from '../../src/utils/theme';

const { width } = Dimensions.get('window');
const CATEGORIES = ['All', 'VENUE', 'CATERING', 'PHOTOGRAPHY_VIDEO', 'AV_PRODUCTION', 'DECOR_FLORALS', 'ENTERTAINMENT', 'MAKEUP_ARTIST', 'SPEAKER'];

export default function VendorsScreen() {
  const params = useLocalSearchParams();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState((params.category as string) || '');
  const [sortBy, setSortBy] = useState('rating');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['vendors-search', category, sortBy],
    queryFn: () => vendorsApi.search({
      category: category || undefined,
      city: 'Lagos',
      sortBy,
    }).then(r => r.data),
  });

  const vendors = (data?.vendors || []).filter((v: any) =>
    !search || v.businessName.toLowerCase().includes(search.toLowerCase())
  );

  const renderVendor = ({ item: v }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push(`/vendor/${v.slug}`)}
      activeOpacity={0.88}
      style={{ width: (width - SPACING.lg * 2 - SPACING.sm) / 2, marginBottom: SPACING.sm }}
    >
      <Card padding={0} style={{ overflow: 'hidden' }}>
        {/* Photo */}
        <View style={{ height: 120, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
          {v.portfolioItems?.[0]?.url ? (
            <Image
              source={{ uri: v.portfolioItems[0].url }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <Text style={{ fontSize: 44 }}>{VENDOR_EMOJIS[v.category] || '🏢'}</Text>
          )}
          {v.isInstantBook && (
            <View style={{
              position: 'absolute', top: 6, right: 6,
              backgroundColor: COLORS.dark, paddingHorizontal: 6, paddingVertical: 2,
              borderRadius: RADIUS.full,
            }}>
              <Text style={{ color: COLORS.white, fontSize: 9, fontWeight: '700' }}>⚡ Instant</Text>
            </View>
          )}
          {v.isFeatured && (
            <View style={{
              position: 'absolute', top: 6, left: 6,
              backgroundColor: COLORS.accent, paddingHorizontal: 6, paddingVertical: 2,
              borderRadius: RADIUS.full,
            }}>
              <Text style={{ color: COLORS.white, fontSize: 9, fontWeight: '700' }}>⭐ Featured</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={{ padding: SPACING.sm }}>
          <Text style={{ fontSize: 10, color: COLORS.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {VENDOR_LABELS[v.category] || v.category}
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.dark, marginVertical: 2 }} numberOfLines={1}>
            {v.businessName}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: COLORS.muted }}>
              ⭐ {Number(v.rating).toFixed(1)} ({v.reviewCount})
            </Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary, marginTop: 4 }}>
            From {formatNGN(v.minPrice, true)}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View style={{ backgroundColor: COLORS.white, paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <Text style={{ ...TYPOGRAPHY.h3, marginBottom: SPACING.sm }}>Browse Vendors</Text>

        {/* Search */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: COLORS.bg, borderRadius: RADIUS.md,
          paddingHorizontal: SPACING.sm, paddingVertical: 8,
          borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm,
        }}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search vendors..."
            placeholderTextColor={COLORS.muted}
            style={{ flex: 1, fontSize: 14, color: COLORS.dark }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: COLORS.muted, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingBottom: SPACING.sm }}
        >
          {CATEGORIES.map(cat => {
            const active = cat === 'All' ? !category : category === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat === 'All' ? '' : cat)}
                activeOpacity={0.8}
                style={{
                  paddingHorizontal: 12, paddingVertical: 6,
                  borderRadius: RADIUS.full,
                  backgroundColor: active ? COLORS.dark : COLORS.bg,
                  borderWidth: 1, borderColor: active ? COLORS.dark : COLORS.border,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: active ? COLORS.white : COLORS.mid }}>
                  {cat === 'All' ? 'All' : `${VENDOR_EMOJIS[cat]} ${VENDOR_LABELS[cat]}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Sort */}
      <View style={{ flexDirection: 'row', gap: 6, padding: SPACING.sm, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        {[
          { key: 'rating', label: '⭐ Top Rated' },
          { key: 'bookings', label: '🔥 Most Booked' },
          { key: 'price_asc', label: '💰 Price ↑' },
        ].map(s => (
          <TouchableOpacity
            key={s.key}
            onPress={() => setSortBy(s.key)}
            style={{
              paddingHorizontal: 10, paddingVertical: 5,
              borderRadius: RADIUS.full,
              backgroundColor: sortBy === s.key ? COLORS.primaryLight : 'transparent',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: sortBy === s.key ? COLORS.primary : COLORS.muted }}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={{ ...TYPOGRAPHY.caption, marginLeft: 'auto', alignSelf: 'center' }}>
          {vendors.length} vendors
        </Text>
      </View>

      {/* Vendor grid */}
      {isLoading ? <Spinner /> : vendors.length === 0 ? (
        <EmptyState emoji="🔍" title="No vendors found" description="Try adjusting your filters" />
      ) : (
        <FlatList
          data={vendors}
          renderItem={renderVendor}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: SPACING.sm }}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxl }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
